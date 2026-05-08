// POST /api/widget/[id]/message
// Body: { text: string, lang?: BotLang, conversationId?: string, channel?: string }
// Returns: { reply, source, conversationId }

import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { botReply, type Bot, type BotLang } from '@/lib/bots';

export const runtime = 'nodejs';
export const maxDuration = 15;

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

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const id = new URL(req.url).pathname.split('/').at(-2) ?? '';
  if (!id) return corsError(400, 'MISSING_ID');

  let body: MessageBody;
  try { body = await req.json(); } catch { return corsError(400, 'INVALID_JSON'); }

  const text = (body.text ?? '').trim();
  if (!text)                return corsError(400, 'EMPTY_TEXT');
  if (text.length > 2000)   return corsError(400, 'TEXT_TOO_LONG');

  // Load bot + faqs + chunks (everything answer engine needs)
  const dbBot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    with: { faqs: true, chunks: true },
  });
  if (!dbBot)                       return corsError(404, 'BOT_NOT_FOUND');
  if (dbBot.status !== 'active')    return corsError(403, 'BOT_NOT_ACTIVE');

  const lang: BotLang = (body.lang ?? dbBot.primaryLang) as BotLang;

  // Re-shape DB rows into the Bot interface that botReply() expects
  const botForEngine: Bot = {
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
    status:       dbBot.status as Bot['status'],
    createdAt:    dbBot.createdAt.toISOString(),
    updatedAt:    dbBot.updatedAt.toISOString(),
    stats:        dbBot.statsCache as Bot['stats'],
    faqs:         dbBot.faqs.map(f => ({ id: f.id, q: f.question, a: f.answer })),
    knowledgeChunks: dbBot.chunks.map(c => ({
      id: c.id, heading: c.heading, content: c.content, keywords: c.keywords as string[],
    })),
  };

  const { text: reply, source } = botReply(text, botForEngine, lang);

  // ── Persist conversation + messages (best-effort; don't fail the reply on DB error) ──
  let conversationId = body.conversationId;
  try {
    if (!conversationId) {
      const [convo] = await db.insert(schema.conversations).values({
        botId:    dbBot.id,
        channel:  body.channel ?? 'web',
        language: lang,
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
      { conversationId, fromUser: false, content: reply, source },
    ]);

    // Bump bot stats cache
    await db.update(schema.bots)
      .set({
        statsCache: {
          ...(dbBot.statsCache as Bot['stats']),
          messages: ((dbBot.statsCache as Bot['stats']).messages ?? 0) + 1,
        },
      })
      .where(eq(schema.bots.id, dbBot.id));
  } catch (e) {
    console.error('[widget/message] logging failed:', e);
  }

  return corsJson({ ok: true, reply, source, conversationId });
}
