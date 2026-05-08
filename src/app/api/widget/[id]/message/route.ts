// POST /api/widget/[id]/message — public, CORS-enabled.
// Hardened with: per-IP rate limit, per-bot rate limit, per-visitor rate limit,
// origin allowlist, and plan-tier monthly message ceiling.

import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { answer } from '@/lib/answer-engine';
import { type Bot, type BotLang } from '@/lib/bots';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';
import { isOriginAllowed } from '@/lib/origin-check';
import { getSubscriptionForBot, incrementMessageCount } from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function OPTIONS() { return corsPreflight(); }

interface MessageBody {
  text: string;
  lang?: BotLang;
  conversationId?: string;
  channel?: 'web' | 'telegram' | 'instagram' | 'facebook' | 'playground';
  visitorId?: string;
  pageUrl?: string;
  pageTitle?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const { id } = await params;
  if (!id) return corsError(400, 'MISSING_ID');

  let body: MessageBody;
  try { body = await req.json(); }
  catch { return corsError(400, 'INVALID_JSON'); }

  const text = (body.text ?? '').trim();
  if (!text)              return corsError(400, 'EMPTY_TEXT');
  if (text.length > 2000) return corsError(400, 'TEXT_TOO_LONG');

  // ── Tier 1: per-IP rate limit (anti-DDoS) ──────────────────────────────
  const ip = getClientIp(req);
  const rlIp = await checkRateLimit(rateLimitKey(['ip', ip]), 30, 60); // 30/min
  if (!rlIp.allowed) {
    return corsError(429, 'RATE_LIMITED', `Slow down — ${Math.ceil(rlIp.resetInMs / 1000)}s remaining.`);
  }

  // ── Tier 2: per-visitor rate limit (anti-abuse from same browser) ─────
  if (body.visitorId) {
    const rlVis = await checkRateLimit(rateLimitKey(['vis', body.visitorId]), 60, 3600); // 60/h
    if (!rlVis.allowed) {
      return corsError(429, 'RATE_LIMITED', 'Visitor message limit reached for this hour.');
    }
  }

  // Load bot + faqs + chunks (needed for answer engine)
  const dbBot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    with: { faqs: true, chunks: true },
  });
  if (!dbBot)                    return corsError(404, 'BOT_NOT_FOUND');
  if (dbBot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');

  // ── Origin allowlist ────────────────────────────────────────────────────
  const originHeader = req.headers.get('origin') ?? req.headers.get('referer');
  // Skip enforcement for playground (channel='playground' is owner-side)
  const isPlayground = body.channel === 'playground';
  if (
    !isPlayground &&
    Array.isArray(dbBot.allowedOrigins) &&
    (dbBot.allowedOrigins as string[]).length > 0 &&
    !isOriginAllowed(dbBot.allowedOrigins as string[], originHeader)
  ) {
    return corsError(403, 'ORIGIN_NOT_ALLOWED');
  }

  // ── Tier 3: per-bot rate limit (cost shield) ───────────────────────────
  const rlBot = await checkRateLimit(rateLimitKey(['bot', dbBot.id]), 120, 60); // 120/min
  if (!rlBot.allowed) {
    return corsError(429, 'RATE_LIMITED', 'Bot is busy — try again shortly.');
  }

  // ── Plan-tier check: subscription usable + monthly cap ─────────────────
  const sub = await getSubscriptionForBot(dbBot.id);
  if (!sub) return corsError(404, 'BOT_NOT_FOUND');
  if (!sub.usable) {
    // Soft-fail: still let the user see an explanatory bot reply
    return corsJson({
      ok: true,
      reply: 'ეს ბოტი ახლა მიუწვდომელია — გთხოვთ, დაუკავშირდით ფლობელს.',
      source: 'fallback' as const,
      conversationId: body.conversationId,
    });
  }
  const planLimits = getLimits(sub.plan);
  if (sub.messagesThisPeriod >= planLimits.messagesPerMonth) {
    return corsJson({
      ok: true,
      reply: 'ამ ბოტმა ამ თვის ლიმიტი ამოწურა. ფლობელმა უნდა გადააქციოს უფრო მაღალი პლანი.',
      source: 'fallback' as const,
      conversationId: body.conversationId,
    });
  }

  const lang: BotLang = (body.lang ?? dbBot.primaryLang) as BotLang;

  const bot: Bot = {
    id:           dbBot.id,
    name:         dbBot.name,
    industry:     dbBot.industry,
    languages:    dbBot.languages as BotLang[],
    primaryLang:  dbBot.primaryLang as BotLang,
    tone:         dbBot.tone as Bot['tone'],
    greeting:     dbBot.greeting as Bot['greeting'],
    fallback:     dbBot.fallback as Bot['fallback'],
    websiteUrl:   dbBot.websiteUrl ?? undefined,
    brandColor:   dbBot.brandColor,
    leadCapture:  dbBot.leadCapture as Bot['leadCapture'],
    allowedOrigins: (dbBot.allowedOrigins as string[]) ?? [],
    status:       dbBot.status as Bot['status'],
    createdAt:    dbBot.createdAt.toISOString(),
    updatedAt:    dbBot.updatedAt.toISOString(),
    stats:        dbBot.statsCache as Bot['stats'],
    faqs:         dbBot.faqs.map(f => ({ id: f.id, q: f.question, a: f.answer })),
    knowledgeChunks: dbBot.chunks.map(c => ({
      id: c.id, heading: c.heading, content: c.content, keywords: c.keywords as string[],
    })),
  };

  // Pull recent conversation history for follow-up context
  let history: { role: 'user' | 'assistant'; content: string }[] | undefined;
  if (body.conversationId) {
    try {
      const past = await db.query.messages.findMany({
        where: eq(schema.messages.conversationId, body.conversationId),
        orderBy: [desc(schema.messages.createdAt)],
        limit: 6,
      });
      history = past.reverse().map(m => ({
        role: (m.fromUser ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));
    } catch (e) {
      console.error('[widget/message] history fetch failed:', e);
    }
  }

  // Run the answer engine
  let result;
  try {
    result = await answer({ query: text, bot, lang, history });
  } catch (e) {
    console.error('[widget/message] answer engine failed:', e);
    result = {
      text: bot.fallback[lang] ?? bot.fallback[bot.primaryLang] ?? 'სამწუხაროდ ვერ ვიპოვე პასუხი.',
      source: 'fallback' as const,
    };
  }

  // Persist conversation + messages (best-effort)
  let conversationId = body.conversationId;
  try {
    if (!conversationId) {
      const [convo] = await db.insert(schema.conversations).values({
        botId:     dbBot.id,
        channel:   body.channel ?? 'web',
        language:  lang,
        visitorId: body.visitorId?.slice(0, 64) ?? null,
        metadata: {
          pageUrl:   body.pageUrl?.slice(0, 500),
          pageTitle: body.pageTitle?.slice(0, 200),
          userAgent: req.headers.get('user-agent')?.slice(0, 200),
          referer:   req.headers.get('referer')?.slice(0, 500),
        },
      }).returning({ id: schema.conversations.id });
      conversationId = convo.id;
    }

    await db.insert(schema.messages).values([
      { conversationId, fromUser: true,  content: text },
      { conversationId, fromUser: false, content: result.text, source: result.source },
    ]);

    // Bump bot stats
    await db.update(schema.bots)
      .set({
        statsCache: {
          ...(dbBot.statsCache as Bot['stats']),
          messages: ((dbBot.statsCache as Bot['stats']).messages ?? 0) + 1,
        },
      })
      .where(eq(schema.bots.id, dbBot.id));

    // Bump owner subscription counter (drives monthly cap)
    await incrementMessageCount(sub.userId);
  } catch (e) {
    console.error('[widget/message] logging failed:', e);
  }

  return corsJson({
    ok: true,
    reply: result.text,
    source: result.source,
    conversationId,
  });
}
