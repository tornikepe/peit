// Meta (Instagram + Facebook Messenger) inbound webhook.
//
// Single endpoint for both products — Meta delivers all subscribed events
// to the same App-level webhook URL configured in App Dashboard → Webhooks
// → Messenger / Instagram. We discriminate by the top-level `object` field:
//   "page"      → Facebook Messenger
//   "instagram" → Instagram Direct
//
// Verification (GET): Meta hits this URL once with a challenge during setup.
// We answer with the challenge value only if the verify_token matches the
// META_WEBHOOK_VERIFY_TOKEN env var we registered in the App Dashboard.
//
// Authenticity (POST): every payload is HMAC-SHA256 signed with the App
// Secret and delivered in the X-Hub-Signature-256 header. We verify before
// touching the body so a spoofed payload never reaches the answer engine.
//
// NOTE: this scaffolding is shipped now so the App Review flow can target
// a working URL. End-to-end message delivery requires:
//   - META_APP_ID, META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN in env
//   - A page connected to a bot via the OAuth route (next file)
//   - App Review approval for pages_messaging / instagram_manage_messages

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { type Bot, type BotLang } from '@/lib/bots';
import { answer } from '@/lib/answer-engine';
import {
  findMetaBotByPageId, recordInbound, markChannelError,
} from '@/db/queries/channels';
import {
  getWebhookVerifyToken, sendMessengerMessage, sendInstagramMessage,
} from '@/lib/meta';
import { getSubscriptionForBot, incrementMessageCount, incrementTokenUsage } from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';
import { extractGeo } from '@/lib/geoip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 50;

// ─── GET: Meta verification challenge ─────────────────────────────────────

export async function GET(req: Request) {
  const url       = new URL(req.url);
  const mode      = url.searchParams.get('hub.mode');
  const token     = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const expected = getWebhookVerifyToken();
  if (mode === 'subscribe' && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ─── POST: actual delivery ────────────────────────────────────────────────

interface MetaMessagingEvent {
  sender:    { id: string };
  recipient: { id: string }; // page ID
  timestamp: number;
  message?: {
    mid:  string;
    text?: string;
    // attachments etc. — we ignore non-text
  };
}

interface MetaEntry {
  id:        string; // page ID
  time:      number;
  messaging: MetaMessagingEvent[];
}

interface MetaPayload {
  object: 'page' | 'instagram';
  entry:  MetaEntry[];
}

function verifySignature(raw: string, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith('sha256=')) return false;
  const provided = header.slice(7);
  const expected = crypto.createHmac('sha256', appSecret).update(raw).digest('hex');
  try {
    const a = Buffer.from(provided, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export async function POST(req: Request) {
  // Per-IP cap covers the gap when paste-token mode skips HMAC: an
  // attacker who knows a connected pageId could otherwise burn AI budget
  // by spamming spoofed events. 300/min/IP is far above Meta's real
  // delivery rate but cheap to enforce.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(rateLimitKey(['meta_wh_ip', ip]), 300, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  // Two operating modes are supported here:
  //   1. Peit owns a Meta App → META_APP_SECRET is set → enforce HMAC.
  //      Every paid SaaS deployment should run in this mode.
  //   2. Customers paste their own Page Access Tokens (paste-token mode) →
  //      Meta App lives on the customer side → HMAC would be signed with
  //      a per-customer App Secret we don't have. Skip the signature check
  //      and rely on pageId routing (findMetaBotByPageId) as the auth gate.
  //      Spoofing requires knowing an exact connected pageId.
  const appSecret = process.env.META_APP_SECRET?.trim();
  const raw = await req.text();

  if (appSecret) {
    if (!verifySignature(raw, req.headers.get('x-hub-signature-256'), appSecret)) {
      console.warn('[meta webhook] signature mismatch');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
    }
  } else {
    // Permissive mode is fine for paste-token deployments but operators
    // should know. Print once per cold start.
    console.warn('[meta webhook] META_APP_SECRET not set — HMAC verification disabled; pageId routing only');
  }

  let payload: MetaPayload;
  try { payload = JSON.parse(raw) as MetaPayload; }
  catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }

  const channel = payload.object === 'instagram' ? 'instagram' : 'facebook';

  // Process each entry (each page) in parallel; failures are isolated.
  // Some malformed / health-check payloads arrive without `entry` (Meta's
  // own probe tool fires them too) — `?? []` so we 200 quietly instead of
  // 500'ing on `.map` of undefined.
  const geo = extractGeo(req);
  await Promise.all((payload.entry ?? []).map(entry =>
    handleEntry(channel, entry, geo).catch(e =>
      console.error('[meta webhook] entry failed:', entry.id, e),
    ),
  ));

  // Always 200 so Meta doesn't retry — we've already logged any failure.
  return NextResponse.json({ received: true });
}

async function handleEntry(
  channel: 'instagram' | 'facebook',
  entry:   MetaEntry,
  geo:     { country: string | null; city: string | null },
): Promise<void> {
  for (const evt of entry.messaging ?? []) {
    const text = evt.message?.text;
    if (!text || evt.sender.id === entry.id) continue; // skip echoes

    const match = await findMetaBotByPageId(entry.id, channel);
    if (!match) continue; // unknown page, no bot connected

    // Per-sender rate limit — mirrors the per-chat cap on the Telegram
    // webhook so one Messenger / IG thread can't drain a bot's monthly
    // quota. 30/h/sender is generous for a real customer conversation.
    const rl = await checkRateLimit(
      rateLimitKey(['meta_sender', match.botId, evt.sender.id]),
      30, 3600,
    );
    if (!rl.allowed) continue; // silently drop; sender keeps writing, we don't burn AI

    const db = getDb();
    if (!db) continue;

    const dbBot = await db.query.bots.findFirst({
      where: eq(schema.bots.id, match.botId),
      with: { faqs: true, chunks: true },
    });
    if (!dbBot || dbBot.status !== 'active') continue;

    const sub = await getSubscriptionForBot(dbBot.id);
    if (!sub || !sub.usable) continue;
    const planLimits = getLimits(sub.plan);
    if (sub.messagesThisPeriod >= planLimits.messagesPerMonth) continue;

    const lang = (dbBot.primaryLang ?? 'ka') as BotLang;
    const bot: Bot = botFromDbRow(dbBot, lang);

    let result;
    try {
      result = await answer({ query: text, bot, lang });
    } catch (e) {
      console.error('[meta webhook] answer failed:', e);
      result = { text: bot.fallback[lang] ?? 'Sorry, I could not answer.', source: 'fallback' as const };
    }

    try {
      const send = channel === 'instagram' ? sendInstagramMessage : sendMessengerMessage;
      await send(match.creds.pageAccessToken, evt.sender.id, result.text);
    } catch (e) {
      console.error('[meta webhook] send failed:', e);
      await markChannelError(match.botId, channel,
        e instanceof Error ? e.message : 'send_failed');
      continue;
    }

    // Persist + counters (best effort)
    try {
      const visitor = `${channel}:${evt.sender.id}`.slice(0, 64);
      const [convo] = await db.insert(schema.conversations).values({
        botId:     dbBot.id,
        channel,
        language:  lang,
        visitorId: visitor,
        country:   geo.country,
        city:      geo.city,
        metadata:  { pageId: entry.id, senderId: evt.sender.id },
      }).returning({ id: schema.conversations.id });
      await db.insert(schema.messages).values([
        { conversationId: convo.id, fromUser: true,  content: text },
        { conversationId: convo.id, fromUser: false, content: result.text, source: 'source' in result ? result.source : 'fallback' },
      ]);
      await incrementMessageCount(sub.userId);
      if (result.source === 'ai' && 'usage' in result && result.usage) {
        await incrementTokenUsage(sub.userId, result.usage);
      }
      await recordInbound(match.botId, channel);
    } catch (e) {
      console.error('[meta webhook] persist failed:', e);
    }
  }
}

// Inline DB row shape — relations loaded above via `with: { faqs, chunks }`.
interface DbBotWithRelations {
  id:             string;
  name:           string;
  industry:       string;
  languages:      unknown;
  primaryLang:    string;
  tone:           string;
  greeting:       unknown;
  fallback:       unknown;
  websiteUrl:     string | null;
  brandColor:     string;
  leadCapture:    unknown;
  allowedOrigins: unknown;
  status:         string;
  createdAt:      Date;
  updatedAt:      Date;
  statsCache:     unknown;
  faqs:           Array<{ id: string; question: string; answer: string }>;
  chunks:         Array<{ id: string; heading: string; content: string; keywords: unknown }>;
}

/** Shared bot-row → answer-engine shape conversion. */
function botFromDbRow(dbBot: DbBotWithRelations, lang: BotLang): Bot {
  return {
    id:             dbBot.id,
    name:           dbBot.name,
    industry:       dbBot.industry,
    languages:      dbBot.languages as BotLang[],
    primaryLang:    lang,
    tone:           dbBot.tone as Bot['tone'],
    greeting:       dbBot.greeting as Bot['greeting'],
    fallback:       dbBot.fallback as Bot['fallback'],
    websiteUrl:     dbBot.websiteUrl ?? undefined,
    brandColor:     dbBot.brandColor,
    leadCapture:    dbBot.leadCapture as Bot['leadCapture'],
    allowedOrigins: (dbBot.allowedOrigins as string[]) ?? [],
    status:         dbBot.status as Bot['status'],
    createdAt:      dbBot.createdAt.toISOString(),
    updatedAt:      dbBot.updatedAt.toISOString(),
    stats:          dbBot.statsCache as Bot['stats'],
    faqs:           dbBot.faqs.map(f => ({ id: f.id, q: f.question, a: f.answer })),
    knowledgeChunks: dbBot.chunks.map(c => ({
      id: c.id, heading: c.heading, content: c.content, keywords: c.keywords as string[],
    })),
  };
}
