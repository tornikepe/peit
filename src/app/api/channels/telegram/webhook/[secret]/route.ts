// POST /api/channels/telegram/webhook/[secret]
//
// Inbound Telegram message handler. The `[secret]` segment doubles as the
// routing key: each TG bot has a unique webhookSecret stored on its
// bot_channels row, so a single endpoint can serve every connected bot
// without leaking internal bot IDs in the URL.
//
// Defense:
//   1. URL path segment must match a known webhookSecret (DB lookup).
//   2. Telegram-side X-Telegram-Bot-Api-Secret-Token header MUST equal the
//      same secret — without this any actor who guesses the URL could spam
//      us. Both checks together = mutual auth.
//   3. Per-IP rate limit (Telegram's CDN is shared, so don't be too tight).
//   4. Per-chat rate limit so one chat can't burn the bot's whole quota.
//
// Reply flow: typing indicator → answer engine → sendMessage. Failures
// degrade to a polite static fallback in the bot's primary language.

import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { type Bot, type BotLang } from '@/lib/bots';
import { answer } from '@/lib/answer-engine';
import {
  findTelegramBotByWebhookSecret, recordInbound, markChannelError,
} from '@/db/queries/channels';
import { sendMessage, sendTyping, type TgUpdate } from '@/lib/telegram';
import {
  checkRateLimit, getClientIp, rateLimitKey,
} from '@/lib/rate-limit';
import { extractGeo } from '@/lib/geoip';
import { handoffReply } from '@/lib/handoff';
import { getSubscriptionForBot, incrementMessageCount, incrementTokenUsage } from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// LLM reply may take >10s on cold starts; keep headroom but stay under
// Telegram's webhook timeout (60s — they retry the same update otherwise).
export const maxDuration = 50;

interface RouteCtx { params: Promise<{ secret: string }> }

export async function POST(req: Request, { params }: RouteCtx) {
  const { secret } = await params;
  if (!secret) return NextResponse.json({ ok: false }, { status: 400 });

  // ── Per-IP guard (cheap) ───────────────────────────────────────────────
  const ip = getClientIp(req);
  const rlIp = await checkRateLimit(rateLimitKey(['tg_ip', ip]), 600, 60);
  if (!rlIp.allowed) {
    return NextResponse.json({ ok: false, error: 'RATE_LIMITED' }, { status: 429 });
  }

  // ── Resolve the bot from the secret ────────────────────────────────────
  // Even if the URL leaks, the channel row carries a separate webhookSecret;
  // Telegram-side header must also match (checked below).
  const match = await findTelegramBotByWebhookSecret(secret);
  if (!match) {
    // Don't confirm path validity to scanners — same status code as success
    // so probing the URL space yields no signal.
    return NextResponse.json({ ok: true });
  }

  // ── Telegram mutual auth ──────────────────────────────────────────────
  const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
  if (headerSecret !== secret) {
    console.warn('[telegram webhook] header secret mismatch — possible spoof');
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let update: TgUpdate;
  try { update = await req.json() as TgUpdate; }
  catch { return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 }); }

  const msg = update.message ?? update.edited_message;
  if (!msg?.text || !msg.chat?.id) {
    // Photos, stickers, etc. — acknowledge so TG doesn't retry, but ignore.
    return NextResponse.json({ ok: true });
  }

  // ── Per-chat throttle ──────────────────────────────────────────────────
  const rlChat = await checkRateLimit(
    rateLimitKey(['tg_chat', match.botId, String(msg.chat.id)]),
    20, 60,
  );
  if (!rlChat.allowed) {
    // Quietly drop — telling the user about a rate limit invites them to
    // game it. Telegram still gets ok=true.
    return NextResponse.json({ ok: true });
  }

  // ── Load bot + run the answer engine ──────────────────────────────────
  const db = getDb();
  if (!db) return NextResponse.json({ ok: false, error: 'DB' }, { status: 503 });

  const dbBot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, match.botId),
    with: { faqs: true, chunks: true },
  });
  if (!dbBot || dbBot.status !== 'active') {
    // Bot deleted / paused — quietly accept.
    return NextResponse.json({ ok: true });
  }

  const sub = await getSubscriptionForBot(dbBot.id);
  if (!sub || !sub.usable) {
    // Subscription expired — tell the user, but don't burn LLM budget.
    await sendMessage(match.creds.botToken, msg.chat.id,
      'ეს ბოტი ახლა მიუწვდომელია — ფლობელმა უნდა განაახლოს გამოწერა.')
      .catch(() => undefined);
    return NextResponse.json({ ok: true });
  }
  const planLimits = getLimits(sub.plan);
  if (sub.messagesThisPeriod >= planLimits.messagesPerMonth) {
    await sendMessage(match.creds.botToken, msg.chat.id,
      'ამ თვის შეტყობინებათა ლიმიტი ამოწურულია. სცადეთ მომდევნო თვეში.')
      .catch(() => undefined);
    return NextResponse.json({ ok: true });
  }

  // Show "typing..." so the user sees activity while we hit the LLM.
  void sendTyping(match.creds.botToken, msg.chat.id);

  // Map DB row to the Bot shape the answer engine expects.
  const lang = (dbBot.primaryLang ?? 'ka') as BotLang;
  const bot: Bot = {
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

  // Per-chat conversation continuity: reuse the most recent TG conversation
  // for this chat ID so multi-turn context survives between updates.
  const chatVisitorId = `tg:${msg.chat.id}`;
  let conversationId: string | undefined;
  let history: { role: 'user' | 'assistant'; content: string }[] | undefined;
  let isHandedOff = false;
  try {
    const recent = await db.query.conversations.findFirst({
      where: eq(schema.conversations.visitorId, chatVisitorId.slice(0, 64)),
      orderBy: [desc(schema.conversations.startedAt)],
      columns: { id: true, isHandedOff: true },
    });
    if (recent) {
      conversationId = recent.id;
      isHandedOff   = recent.isHandedOff;
      const past = await db.query.messages.findMany({
        where: eq(schema.messages.conversationId, recent.id),
        orderBy: [desc(schema.messages.createdAt)],
        limit: 6,
      });
      history = past.reverse().map(m => ({
        role: (m.fromUser ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));
    }
  } catch (e) {
    console.warn('[telegram webhook] history fetch failed:', e);
  }

  // Generate the reply — handoff short-circuits past the LLM.
  let result: { text: string; source: 'faq' | 'knowledge' | 'ai' | 'fallback' | 'human'; usage?: { inputTokens: number; outputTokens: number; cachedTokens: number } };
  if (isHandedOff) {
    result = { text: handoffReply(lang), source: 'human' };
  } else {
    try {
      result = await answer({ query: msg.text, bot, lang, history });
    } catch (e) {
      console.error('[telegram webhook] answer engine failed:', e);
      result = { text: bot.fallback[lang] ?? 'სამწუხაროდ ვერ ვიპოვე პასუხი.', source: 'fallback' as const };
    }
  }

  // Send reply BEFORE persisting — TG's webhook timeout is tighter than
  // ours, and the user experience of a fast reply matters more than the
  // analytics row.
  try {
    await sendMessage(match.creds.botToken, msg.chat.id, result.text, {
      replyToMessageId: msg.message_id,
    });
  } catch (e) {
    console.error('[telegram webhook] sendMessage failed:', e);
    await markChannelError(match.botId, 'telegram',
      e instanceof Error ? e.message : 'send_failed');
  }

  // ── Persist conversation + counters (best-effort) ──────────────────────
  try {
    if (!conversationId) {
      // Telegram doesn't include user geo in the webhook, but its delivery
      // node tends to be in the user's region — Vercel's edge headers give
      // us at least a country-level signal that's better than nothing.
      const geo = extractGeo(req);
      const [convo] = await db.insert(schema.conversations).values({
        botId:     dbBot.id,
        channel:   'telegram',
        language:  lang,
        visitorId: chatVisitorId.slice(0, 64),
        country:   geo.country,
        city:      geo.city,
        metadata: {
          tgChatId:  msg.chat.id,
          tgUserId:  msg.from?.id,
          tgUsername: msg.from?.username,
          chatType:  msg.chat.type,
          tgLang:    msg.from?.language_code,
        },
      }).returning({ id: schema.conversations.id });
      conversationId = convo.id;
    }
    await db.insert(schema.messages).values([
      { conversationId, fromUser: true,  content: msg.text! },
      { conversationId, fromUser: false, content: result.text, source: 'source' in result ? result.source : 'fallback' },
    ]);
    await db.update(schema.bots)
      .set({
        statsCache: {
          ...(dbBot.statsCache as Bot['stats']),
          messages: ((dbBot.statsCache as Bot['stats']).messages ?? 0) + 1,
        },
      })
      .where(eq(schema.bots.id, dbBot.id));

    // Don't charge the bot's monthly quota for human-handoff hold messages
    // — the owner is doing the answering.
    if (result.source !== 'human') {
      await incrementMessageCount(sub.userId);
    }
    if (result.source === 'ai' && 'usage' in result && result.usage) {
      await incrementTokenUsage(sub.userId, result.usage);
    }
    await recordInbound(match.botId, 'telegram');
  } catch (e) {
    console.error('[telegram webhook] persist failed:', e);
  }

  return NextResponse.json({ ok: true });
}
