// POST /api/widget/[id]/stream — public, CORS-enabled SSE endpoint.
//
// Same auth/limit story as /message, but streams the Claude reply as
// Server-Sent Events so the widget can render a typewriter response.
//
// Event protocol (one JSON object per `data:` line):
//   {type: "start", conversationId}
//   {type: "delta", text}            // many of these
//   {type: "done",  source, usage}   // terminal — usage is optional
//   {type: "error", code, message}   // terminal — replaces "done"
//
// Falls back to a non-AI tier internally if Claude isn't configured, in
// which case the whole reply arrives as a single "delta".

import { eq, desc, and } from 'drizzle-orm';
import { getDb, schema, type MessageAttachment } from '@/db';
import { corsPreflight, corsError, CORS_HEADERS } from '@/lib/widget-cors';
import { answer } from '@/lib/answer-engine';
import { streamAnswer, isLLMAvailable } from '@/lib/llm';
import { type Bot, type BotLang } from '@/lib/bots';
import { searchChunksByVector } from '@/db/queries/chunks';
import { embedOne, isEmbeddingsAvailable } from '@/lib/embeddings';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';
import { isOriginAllowed } from '@/lib/origin-check';
import { extractGeo } from '@/lib/geoip';
import { classifySentiment } from '@/lib/sentiment';
import { resolveAttachments, sanitizeAttachments } from '@/lib/chat-attachments';
import {
  getSubscriptionForBot, incrementMessageCount, incrementTokenUsage,
} from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';
import { handoffReply } from '@/lib/handoff';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function OPTIONS() { return corsPreflight(); }

interface MessageBody {
  text: string;
  lang?: BotLang;
  conversationId?: string;
  channel?: 'web' | 'telegram' | 'instagram' | 'facebook' | 'playground';
  visitorId?: string;
  pageUrl?: string;
  pageTitle?: string;
  /** Files the visitor attached to this turn (Feature #3). */
  attachments?: MessageAttachment[];
}

const enc = new TextEncoder();
function sseLine(obj: unknown): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(obj)}\n\n`);
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

  // Scope attachments to this bot's own upload folder (cross-tenant guard).
  const attachments = sanitizeAttachments(body.attachments, id);
  const text = (body.text ?? '').trim();
  // Empty text is allowed when the visitor sent a file on its own.
  if (!text && attachments.length === 0) return corsError(400, 'EMPTY_TEXT');
  if (text.length > 2000) return corsError(400, 'TEXT_TOO_LONG');

  // Same rate limits as /message — keep semantics identical so we can't be
  // bypassed by hitting one endpoint instead of the other.
  const ip = getClientIp(req);
  const rlIp = await checkRateLimit(rateLimitKey(['ip', ip]), 30, 60);
  if (!rlIp.allowed) return corsError(429, 'RATE_LIMITED');

  if (body.visitorId) {
    const rlVis = await checkRateLimit(rateLimitKey(['vis', body.visitorId]), 60, 3600);
    if (!rlVis.allowed) return corsError(429, 'RATE_LIMITED');
  }

  const dbBot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    with: { faqs: true, chunks: true },
  });
  if (!dbBot)                    return corsError(404, 'BOT_NOT_FOUND');
  if (dbBot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');

  const originHeader = req.headers.get('origin') ?? req.headers.get('referer');
  const isPlayground = body.channel === 'playground';
  if (
    !isPlayground &&
    Array.isArray(dbBot.allowedOrigins) &&
    (dbBot.allowedOrigins as string[]).length > 0 &&
    !isOriginAllowed(dbBot.allowedOrigins as string[], originHeader)
  ) {
    return corsError(403, 'ORIGIN_NOT_ALLOWED');
  }

  const rlBot = await checkRateLimit(rateLimitKey(['bot', dbBot.id]), 120, 60);
  if (!rlBot.allowed) return corsError(429, 'RATE_LIMITED');

  const sub = await getSubscriptionForBot(dbBot.id);
  if (!sub) return corsError(404, 'BOT_NOT_FOUND');
  if (!sub.usable) return corsError(402, 'SUBSCRIPTION_INACTIVE');

  const planLimits = getLimits(sub.plan);
  if (sub.messagesThisPeriod >= planLimits.messagesPerMonth) {
    return corsError(402, 'MESSAGES_LIMIT_REACHED');
  }
  const tokensUsed = sub.tokensInputThisPeriod + sub.tokensOutputThisPeriod;
  if (tokensUsed >= planLimits.tokensPerMonth) {
    return corsError(402, 'TOKENS_LIMIT_REACHED');
  }

  const lang: BotLang = (body.lang ?? dbBot.primaryLang) as BotLang;

  const bot: Bot = {
    id:             dbBot.id,
    name:           dbBot.name,
    industry:       dbBot.industry,
    languages:      dbBot.languages as BotLang[],
    primaryLang:    dbBot.primaryLang as BotLang,
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

  // Pull recent conversation history for follow-up context.
  // SECURITY: same cross-tenant check as /message — validate ownership before
  // reading message history; otherwise a caller could replay a foreign bot's
  // conversation ID and pull its messages into this bot's prompt.
  let history: { role: 'user' | 'assistant'; content: string }[] | undefined;
  let validatedConversationId: string | undefined;
  let isHandedOff = false;
  if (body.conversationId) {
    try {
      const convo = await db.query.conversations.findFirst({
        where: and(
          eq(schema.conversations.id, body.conversationId),
          eq(schema.conversations.botId, dbBot.id),
        ),
        columns: { id: true, isHandedOff: true },
      });
      if (convo) {
        validatedConversationId = convo.id;
        isHandedOff = convo.isHandedOff;
        const past = await db.query.messages.findMany({
          where: eq(schema.messages.conversationId, convo.id),
          orderBy: [desc(schema.messages.createdAt)],
          limit: 6,
        });
        history = past.reverse().map(m => ({
          role: (m.fromUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        }));
      }
    } catch (e) {
      console.error('[widget/stream] history fetch failed:', e);
    }
  }

  // Create/resolve conversation BEFORE streaming so the client can store the ID
  // even if the network drops mid-stream.
  let conversationId = validatedConversationId;
  if (!conversationId) {
    try {
      const geo = extractGeo(req);
      const [convo] = await db.insert(schema.conversations).values({
        botId:     dbBot.id,
        channel:   body.channel ?? 'web',
        language:  lang,
        visitorId: body.visitorId?.slice(0, 64) ?? null,
        country:   geo.country,
        city:      geo.city,
        metadata: {
          pageUrl:   body.pageUrl?.slice(0, 500),
          pageTitle: body.pageTitle?.slice(0, 200),
          userAgent: req.headers.get('user-agent')?.slice(0, 200),
          referer:   req.headers.get('referer')?.slice(0, 500),
        },
      }).returning({ id: schema.conversations.id });
      conversationId = convo.id;
    } catch (e) {
      console.error('[widget/stream] conversation insert failed:', e);
    }
  }

  // Persist user message immediately — if the stream drops we still have a
  // record of what was asked. Sentiment classification (Feature #5) fires
  // in the background and back-fills the row when it returns; we never
  // block the answer on it.
  let userMessageId: string | null = null;
  if (conversationId) {
    try {
      const inserted = await db.insert(schema.messages).values({
        conversationId, fromUser: true,
        content: text || (attachments.length ? `📎 ${attachments.map(a => a.filename).join(', ')}` : ''),
        // Only reference the attachments column when there's something to
        // store — so plain chat keeps working even before the 0020 migration
        // adds the column.
        ...(attachments.length ? { attachments } : {}),
      }).returning({ id: schema.messages.id });
      userMessageId = inserted[0]?.id ?? null;
    } catch (e) {
      console.error('[widget/stream] user message insert failed:', e);
    }
  }
  if (userMessageId) {
    void (async () => {
      const sentiment = await classifySentiment(text);
      if (!sentiment) return;
      try {
        await db.update(schema.messages)
          .set({ sentiment })
          .where(eq(schema.messages.id, userMessageId!));
      } catch (e) {
        console.warn('[widget/stream] sentiment update failed:', e);
      }
    })();
  }

  // ── Build the SSE stream ────────────────────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseLine({ type: 'start', conversationId }));

      // Handed-off conversations never reach the LLM — short-circuit
      // with a polite hold message. Still persist via the same finally{}
      // path below so the owner sees the message in the dashboard
      // transcript.
      if (isHandedOff) {
        const holdText = handoffReply(lang);
        controller.enqueue(sseLine({ type: 'delta', text: holdText }));
        // Persist hold message inline so we can return its id for feedback.
        let holdMessageId: string | null = null;
        if (conversationId) {
          try {
            const inserted = await db.insert(schema.messages).values({
              conversationId, fromUser: false, content: holdText, source: 'human',
            }).returning({ id: schema.messages.id });
            holdMessageId = inserted[0]?.id ?? null;
          } catch (e) {
            console.error('[widget/stream] handoff persist failed:', e);
          }
        }
        controller.enqueue(sseLine({
          type: 'done', source: 'human', usage: null, messageId: holdMessageId,
        }));
        controller.close();
        return;
      }

      let replyText = '';
      let source: 'faq' | 'knowledge' | 'ai' | 'fallback' = 'fallback';
      let usage: { inputTokens: number; outputTokens: number; cachedTokens: number } | null = null;

      try {
        // Tier 1: FAQ — instant, no AI. Reuse the non-streaming engine.
        // Tier 2: RAG with streaming Claude
        // Tier 3: Keyword fallback via the same non-streaming engine
        if (isLLMAvailable()) {
          // Retrieve chunks (mirror answer-engine's tier-2 retrieval)
          let chunks: { heading: string; content: string }[] = [];
          if (isEmbeddingsAvailable()) {
            try {
              const queryEmb = await embedOne(text, 'query');
              if (queryEmb) {
                const dbChunks = await searchChunksByVector(bot.id, queryEmb, 5, 0.25);
                if (dbChunks.length > 0) {
                  chunks = dbChunks.map(c => ({ heading: c.heading, content: c.content }));
                }
              }
            } catch (e) {
              console.error('[widget/stream] vector retrieval failed:', e);
            }
          }
          if (chunks.length === 0) {
            chunks = [
              ...bot.faqs.slice(0, 6).map(f => ({ heading: f.q, content: f.a })),
              ...bot.knowledgeChunks.slice(0, 4).map(c => ({
                heading: c.heading, content: c.content,
              })),
            ];
          }

          // Resolve any attached files (Feature #3): images → base64 for
          // vision, documents → extracted text. When the visitor attached
          // something we always go to the AI (an FAQ match can't "see" a file).
          const resolved = await resolveAttachments(attachments);
          const hasAttachmentContent = resolved.images.length > 0 || resolved.docText.length > 0;

          // Try FAQ exact-match first — short-circuits to instant reply
          // (skipped when there's a file to look at).
          const faqResult = hasAttachmentContent
            ? { source: 'none' as const, text: '' }
            : await answer({ query: text, bot, lang, history });
          if (faqResult.source === 'faq') {
            replyText = faqResult.text;
            source    = 'faq';
            controller.enqueue(sseLine({ type: 'delta', text: replyText }));
          } else {
            // Stream from Claude
            source = 'ai';
            for await (const evt of streamAnswer({
              question:   text || 'Please look at the attached file and respond.',
              chunks,
              botName:    bot.name,
              industry:   bot.industry,
              tone:       bot.tone,
              lang,
              websiteUrl: bot.websiteUrl,
              history,
              images:     resolved.images,
              docText:    resolved.docText || undefined,
            })) {
              if (evt.type === 'delta') {
                replyText += evt.text;
                controller.enqueue(sseLine({ type: 'delta', text: evt.text }));
              } else {
                replyText = evt.text || replyText;
                usage = evt.usage;
              }
            }
            // Empty reply → fall through to non-AI tiers
            if (!replyText) {
              const fallback = await answer({ query: text, bot, lang, history });
              replyText = fallback.text;
              source    = fallback.source;
              controller.enqueue(sseLine({ type: 'delta', text: replyText }));
            }
          }
        } else {
          // No Claude key — run the deterministic engine and emit as one delta.
          const r = await answer({ query: text, bot, lang, history });
          replyText = r.text;
          source    = r.source;
          controller.enqueue(sseLine({ type: 'delta', text: replyText }));
        }

        // Persist the bot message BEFORE emitting `done` so the client can
        // round-trip feedback against its real DB id (Feature #7). The
        // counters + token usage stay async — they don't block UI.
        let messageId: string | null = null;
        if (conversationId && replyText) {
          try {
            const inserted = await db.insert(schema.messages).values({
              conversationId, fromUser: false, content: replyText, source,
            }).returning({ id: schema.messages.id });
            messageId = inserted[0]?.id ?? null;
          } catch (e) {
            console.error('[widget/stream] persist bot msg failed:', e);
          }
        }
        controller.enqueue(sseLine({ type: 'done', source, usage, messageId }));
      } catch (e) {
        console.error('[widget/stream] generation failed:', e);
        const fallback = bot.fallback[lang] ?? bot.fallback[bot.primaryLang]
          ?? 'სამწუხაროდ ვერ ვიპოვე პასუხი.';
        if (!replyText) {
          replyText = fallback;
          controller.enqueue(sseLine({ type: 'delta', text: fallback }));
          // Persist the fallback so feedback works on it too.
          if (conversationId) {
            try {
              const inserted = await db.insert(schema.messages).values({
                conversationId, fromUser: false, content: fallback, source: 'fallback',
              }).returning({ id: schema.messages.id });
              controller.enqueue(sseLine({
                type: 'done', source: 'fallback', usage: null,
                messageId: inserted[0]?.id ?? null,
              }));
            } catch {
              controller.enqueue(sseLine({ type: 'done', source: 'fallback', usage: null, messageId: null }));
            }
          } else {
            controller.enqueue(sseLine({ type: 'done', source: 'fallback', usage: null, messageId: null }));
          }
        } else {
          controller.enqueue(sseLine({
            type: 'done', source: 'fallback', usage: null, messageId: null,
          }));
        }
      } finally {
        controller.close();

        // Bot-side counters / token usage — fire-and-forget; the message row
        // is already persisted above. Skip when the conversation never started
        // (e.g. early DB error) or we never produced text.
        void (async () => {
          if (!conversationId || !replyText) return;
          try {
            await db.update(schema.bots)
              .set({
                statsCache: {
                  ...(dbBot.statsCache as Bot['stats']),
                  messages: ((dbBot.statsCache as Bot['stats']).messages ?? 0) + 1,
                },
              })
              .where(eq(schema.bots.id, dbBot.id));
            await incrementMessageCount(sub.userId);
            if (source === 'ai' && usage) {
              await incrementTokenUsage(sub.userId, usage);
            }
          } catch (e) {
            console.error('[widget/stream] post-stream logging failed:', e);
          }
        })();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx proxy buffering
    },
  });
}
