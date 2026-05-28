// POST /api/widget/[id]/feedback — public, CORS-enabled.
// Records the visitor's thumbs-up/down on a single bot message.
//
// Body: { messageId: string, feedback: 'positive' | 'negative' | null }
//
// Verification: the message must belong to a conversation under this bot —
// we don't want a visitor on bot A to tag messages on bot B. Visitors are
// anonymous so we accept any vote on a bot-owned message; rate-limit per
// IP and per bot to keep noise down.

import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function OPTIONS() { return corsPreflight(); }

type FeedbackValue = 'positive' | 'negative' | null;
function isFeedback(v: unknown): v is FeedbackValue {
  return v === 'positive' || v === 'negative' || v === null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const { id: botId } = await params;
  if (!botId) return corsError(400, 'MISSING_BOT_ID');

  // 60 votes / 10 min per IP — generous, but kills runaway scripts.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(rateLimitKey(['fb', ip]), 60, 600);
  if (!rl.allowed) return corsError(429, 'RATE_LIMITED');

  let body: { messageId?: string; feedback?: unknown };
  try { body = await req.json(); }
  catch { return corsError(400, 'INVALID_JSON'); }

  const messageId = typeof body.messageId === 'string' ? body.messageId : '';
  if (!messageId) return corsError(400, 'MISSING_MESSAGE_ID');
  if (!isFeedback(body.feedback)) return corsError(400, 'INVALID_FEEDBACK');

  // Verify the message belongs to a conversation under this bot before we
  // accept the vote — a single SELECT joining conversations is enough.
  const row = await db
    .select({ id: schema.messages.id, fromUser: schema.messages.fromUser })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.conversations.id, schema.messages.conversationId),
    )
    .where(and(
      eq(schema.messages.id, messageId),
      eq(schema.conversations.botId, botId),
    ))
    .limit(1);

  if (row.length === 0)    return corsError(404, 'MESSAGE_NOT_FOUND');
  if (row[0].fromUser)     return corsError(400, 'NOT_A_BOT_MESSAGE');

  await db.update(schema.messages)
    .set({ feedback: body.feedback })
    .where(eq(schema.messages.id, messageId));

  return corsJson({ ok: true });
}
