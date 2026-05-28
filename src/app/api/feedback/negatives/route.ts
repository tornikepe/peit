// GET /api/feedback/negatives — owner-only.
// Returns bot messages flagged thumbs-down across all of the signed-in
// user's bots, grouped by content and sorted by frequency (high → low).

import { sql } from 'drizzle-orm';
import { withAuth } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';

export const runtime = 'nodejs';

interface NegativeRow extends Record<string, unknown> {
  content: string;
  count: number;
  bot_id: string;
  bot_name: string;
  last_at: string;
  /** A recent example conversation, so the user can click through. */
  conversation_id: string;
}

export const GET = withAuth(async ({ user }) => {
  const db = requireDb();

  const rows = await db.execute<NegativeRow>(sql`
    SELECT
      m.content                    AS content,
      COUNT(*)::int                AS count,
      MAX(b.id)                    AS bot_id,
      MAX(b.name)                  AS bot_name,
      MAX(m.created_at)            AS last_at,
      (ARRAY_AGG(c.id ORDER BY m.created_at DESC))[1] AS conversation_id
    FROM ${schema.messages} m
    JOIN ${schema.conversations} c ON c.id = m.conversation_id
    JOIN ${schema.bots} b ON b.id = c.bot_id
    WHERE m.feedback = 'negative'
      AND b.owner_id = ${user.id}
    GROUP BY m.content
    ORDER BY count DESC, last_at DESC
    LIMIT 200
  `);

  // Drizzle returns either an array or { rows }; normalize.
  const list = (Array.isArray(rows) ? rows : (rows as unknown as { rows: NegativeRow[] }).rows) ?? [];

  return {
    ok: true,
    negatives: list.map(r => ({
      content:         r.content,
      count:           Number(r.count),
      botId:           r.bot_id,
      botName:         r.bot_name,
      lastAt:          r.last_at,
      conversationId:  r.conversation_id,
    })),
  };
});
