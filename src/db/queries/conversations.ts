// Conversation history queries. Every function scopes by userId via the
// owning bot, so a logged-in user only ever sees their own conversations
// regardless of how the URL is crafted.

import { and, asc, count, desc, eq, exists, ilike, inArray, sql } from 'drizzle-orm';
import { requireDb, schema } from '@/db';

export interface ListFilters {
  userId:  string;
  search?: string;       // ILIKE matched against any message.content in the conversation
  tag?:    string;       // exact match against tags[] (JSONB)
  channel?: 'web' | 'telegram' | 'instagram' | 'facebook';
  /** 1-based. Used to compute LIMIT/OFFSET. */
  page:    number;
  limit:   number;
}

export interface ConversationListRow {
  id:           string;
  botId:        string;
  botName:      string;
  channel:      string;
  language:     string;
  country:      string | null;
  city:         string | null;
  tags:         string[];
  isHandedOff:  boolean;
  handedOffAt:  Date | null;
  startedAt:    Date;
  endedAt:      Date | null;
  messageCount: number;
}

/**
 * List conversations the user can see. Search is implemented via EXISTS
 * subquery against messages — Postgres prunes the conversations table by
 * the bot-ownership join first, then only sweeps messages for the rows
 * that survive. Cheaper than a LEFT JOIN + DISTINCT at our volumes.
 */
export async function listConversations(f: ListFilters): Promise<{
  rows: ConversationListRow[];
  total: number;
}> {
  const db = requireDb();
  const page  = Math.max(1, f.page);
  const limit = Math.min(100, Math.max(1, f.limit));

  const searchClause = f.search?.trim()
    ? exists(
        db.select({ x: sql<number>`1` })
          .from(schema.messages)
          .where(and(
            eq(schema.messages.conversationId, schema.conversations.id),
            ilike(schema.messages.content, `%${f.search.trim()}%`),
          )),
      )
    : undefined;

  // JSONB `?` operator: tags ? 'foo' → true iff 'foo' is a top-level
  // element of the tags array. Postgres-native, fast on JSONB.
  const tagClause = f.tag?.trim()
    ? sql`${schema.conversations.tags} ? ${f.tag.trim()}`
    : undefined;

  const channelClause = f.channel
    ? eq(schema.conversations.channel, f.channel)
    : undefined;

  const where = and(
    eq(schema.bots.ownerId, f.userId),
    searchClause,
    tagClause,
    channelClause,
  );

  const rowsP = db
    .select({
      id:          schema.conversations.id,
      botId:       schema.conversations.botId,
      botName:     schema.bots.name,
      channel:     schema.conversations.channel,
      language:    schema.conversations.language,
      country:     schema.conversations.country,
      city:        schema.conversations.city,
      tags:        schema.conversations.tags,
      isHandedOff: schema.conversations.isHandedOff,
      handedOffAt: schema.conversations.handedOffAt,
      startedAt:   schema.conversations.startedAt,
      endedAt:     schema.conversations.endedAt,
      messageCount: sql<number>`(
        SELECT count(*) FROM ${schema.messages}
        WHERE ${schema.messages.conversationId} = ${schema.conversations.id}
      )`.as('msg_count'),
    })
    .from(schema.conversations)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.conversations.botId))
    .where(where)
    .orderBy(desc(schema.conversations.startedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const totalP = db
    .select({ value: count() })
    .from(schema.conversations)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.conversations.botId))
    .where(where);

  const [rows, [{ value: total }]] = await Promise.all([rowsP, totalP]);

  return {
    rows: rows.map(r => ({
      ...r,
      tags:         (r.tags ?? []) as string[],
      messageCount: Number(r.messageCount),
    })),
    total: Number(total),
  };
}

export interface ConversationDetail {
  id:           string;
  botId:        string;
  botName:      string;
  channel:      string;
  language:     string;
  country:      string | null;
  city:         string | null;
  tags:         string[];
  isHandedOff:  boolean;
  handedOffAt:  Date | null;
  startedAt:    Date;
  endedAt:      Date | null;
  metadata:     Record<string, unknown>;
  messages: Array<{
    id:        string;
    role:      'user' | 'bot';
    content:   string;
    source:    string | null;
    feedback:  'positive' | 'negative' | null;
    sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | null;
    attachments: { filename: string; mimeType: string; kind: 'image' | 'document' }[];
    createdAt: Date;
  }>;
}

/** Full transcript + metadata for a single conversation, gated by owner. */
export async function getConversationDetail(
  userId: string, conversationId: string,
): Promise<ConversationDetail | null> {
  const db = requireDb();

  const row = await db
    .select({
      id:          schema.conversations.id,
      botId:       schema.conversations.botId,
      botName:     schema.bots.name,
      channel:     schema.conversations.channel,
      language:    schema.conversations.language,
      country:     schema.conversations.country,
      city:        schema.conversations.city,
      tags:        schema.conversations.tags,
      isHandedOff: schema.conversations.isHandedOff,
      handedOffAt: schema.conversations.handedOffAt,
      startedAt:   schema.conversations.startedAt,
      endedAt:     schema.conversations.endedAt,
      metadata:    schema.conversations.metadata,
    })
    .from(schema.conversations)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.conversations.botId))
    .where(and(
      eq(schema.conversations.id, conversationId),
      eq(schema.bots.ownerId, userId),
    ))
    .limit(1);

  if (row.length === 0) return null;
  const c = row[0];

  const msgs = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, c.id))
    .orderBy(asc(schema.messages.createdAt));

  return {
    ...c,
    tags:     (c.tags ?? []) as string[],
    metadata: (c.metadata ?? {}) as Record<string, unknown>,
    messages: msgs.map(m => ({
      id:        m.id,
      role:      m.fromUser ? 'user' : 'bot',
      content:   m.content,
      source:    m.source,
      feedback:  m.feedback ?? null,
      sentiment: m.sentiment ?? null,
      attachments: (m.attachments ?? []).map(a => ({
        filename: a.filename, mimeType: a.mimeType, kind: a.kind,
      })),
      createdAt: m.createdAt,
    })),
  };
}

export interface PatchConversation {
  tags?:        string[];
  isHandedOff?: boolean;
}

/** Owner-only update of tags / handoff. Returns false if not authorised. */
export async function patchConversation(
  userId: string, conversationId: string, patch: PatchConversation,
): Promise<boolean> {
  const db = requireDb();

  // First confirm ownership via bots — UPDATE ... FROM would inline this
  // but Drizzle's typed builder makes the two-step variant cleaner.
  const owns = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.conversations.botId))
    .where(and(
      eq(schema.conversations.id, conversationId),
      eq(schema.bots.ownerId, userId),
    ))
    .limit(1);
  if (owns.length === 0) return false;

  const update: Partial<typeof schema.conversations.$inferInsert> = {};
  if (patch.tags !== undefined) {
    // Dedup + cap at 16 tags so a buggy client can't unbounded-grow JSONB.
    update.tags = Array.from(new Set(patch.tags.map(t => t.trim()).filter(Boolean))).slice(0, 16);
  }
  if (patch.isHandedOff !== undefined) {
    update.isHandedOff = patch.isHandedOff;
    // Stamp handedOffAt on transition true; clear on transition false so
    // toggling off doesn't leave a misleading timestamp behind.
    update.handedOffAt = patch.isHandedOff ? new Date() : null;
  }
  if (Object.keys(update).length === 0) return true;
  await db.update(schema.conversations)
    .set(update)
    .where(eq(schema.conversations.id, conversationId));
  return true;
}

/** All tags ever used across the user's conversations — for filter dropdown. */
export async function listAllTagsForUser(userId: string): Promise<string[]> {
  const db = requireDb();
  // jsonb_array_elements_text expands each tag array into rows; DISTINCT collapses.
  const rows = await db.execute<{ tag: string }>(sql`
    SELECT DISTINCT jsonb_array_elements_text(c.tags) AS tag
    FROM conversations c
    INNER JOIN bots b ON b.id = c.bot_id
    WHERE b.owner_id = ${userId}
    ORDER BY tag ASC
  `);
  // postgres-js returns rows as a plain array-like; map defensively.
  const list = Array.isArray(rows) ? rows : (rows as { rows: { tag: string }[] }).rows;
  return list.map(r => r.tag).filter(Boolean);
}

/** Convenience for tests / handoff webhook short-circuits. */
export async function isConversationHandedOff(conversationId: string): Promise<boolean> {
  const db = requireDb();
  const r = await db
    .select({ v: schema.conversations.isHandedOff })
    .from(schema.conversations)
    .where(eq(schema.conversations.id, conversationId))
    .limit(1);
  return r[0]?.v ?? false;
}

// Re-exports for handlers (keeps imports tidy at call sites).
export { inArray };
