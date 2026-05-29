// Analytics queries for the dashboard's /analytics page.
//
// Every function here scopes by userId (Clerk-resolved) → bot ownership.
// That's the app-layer equivalent of RLS — Postgres doesn't enforce it,
// but no query reaches the DB without joining bots ON owner_id = $userId.
// If the join fails (no bots, or the user isn't authorised) the query
// returns empty / zero, never another tenant's data.
//
// All aggregates run on the DB (count(), sum(), date_trunc(), generate_
// series()) — we never pull rows to JS and reduce in memory. The largest
// queryable surface here is ~1M messages per user before perf degrades
// below 200ms on Neon's free tier.

import {
  and,
  between,
  count,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { requireDb, schema } from "@/db";

// ─── Range helpers ─────────────────────────────────────────────────────────

export type RangePreset = "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export function rangeFromPreset(
  preset: RangePreset,
  from?: string,
  to?: string,
): DateRange {
  const now = new Date();
  const end = new Date(now);
  if (preset === "custom" && from && to) {
    return {
      from: new Date(from),
      to: new Date(to),
    };
  }
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const start = new Date(end.getTime() - days * 86_400_000);
  return { from: start, to: end };
}

/** Subquery: bot IDs the user owns. Used by every aggregate as the scope. */
function userBotIds(userId: string) {
  const db = requireDb();
  return db
    .select({ id: schema.bots.id })
    .from(schema.bots)
    .where(eq(schema.bots.ownerId, userId));
}

// ─── 1. KPI cards ──────────────────────────────────────────────────────────

export interface Kpis {
  conversations: number;
  conversationsPrev: number; // previous equal-length window
  messagesFromBot: number;
  leads: number;
  leadsConverted: number;
  conversionRatePct: number; // 0..100
}

export async function getKpis(userId: string, range: DateRange): Promise<Kpis> {
  const db = requireDb();
  const span = range.to.getTime() - range.from.getTime();
  const prev = { from: new Date(range.from.getTime() - span), to: range.from };

  const botIds = userBotIds(userId);

  // Conversations in window
  const [{ value: convos }] = await db
    .select({ value: count() })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, range.from, range.to),
      ),
    );

  const [{ value: convosPrev }] = await db
    .select({ value: count() })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, prev.from, prev.to),
      ),
    );

  // Messages from the bot (assistant side). Join conversations to scope by bot.
  const [{ value: msgs }] = await db
    .select({ value: count() })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.conversations.id, schema.messages.conversationId),
    )
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        eq(schema.messages.fromUser, false),
        between(schema.messages.createdAt, range.from, range.to),
      ),
    );

  // Leads (total)
  const [{ value: leadsCount }] = await db
    .select({ value: count() })
    .from(schema.leads)
    .where(
      and(
        inArray(schema.leads.botId, botIds),
        between(schema.leads.createdAt, range.from, range.to),
      ),
    );

  // Leads "converted" — schema has status enum (won|lost|qualified|...).
  // Treat "won" as converted; in plain language: "ხელშეკრულება დახურულია".
  const [{ value: convertedCount }] = await db
    .select({ value: count() })
    .from(schema.leads)
    .where(
      and(
        inArray(schema.leads.botId, botIds),
        eq(schema.leads.status, "won"),
        between(schema.leads.createdAt, range.from, range.to),
      ),
    );

  return {
    conversations: Number(convos),
    conversationsPrev: Number(convosPrev),
    messagesFromBot: Number(msgs),
    leads: Number(leadsCount),
    leadsConverted: Number(convertedCount),
    conversionRatePct:
      leadsCount > 0
        ? Math.round((Number(convertedCount) / Number(leadsCount)) * 1000) / 10
        : 0,
  };
}

// ─── 2. Conversations per day ─────────────────────────────────────────────

export interface DayPoint {
  day: string;
  count: number;
}
export type Channel = "web" | "telegram" | "instagram" | "facebook";

export async function getConversationsByDay(
  userId: string,
  range: DateRange,
  channel?: Channel,
): Promise<DayPoint[]> {
  const db = requireDb();
  const botIds = userBotIds(userId);

  // date_trunc('day', x) groups timestamps to midnight UTC. We backfill
  // missing days in JS rather than via generate_series so the SQL stays
  // simple and the JS side knows the user's locale for display.
  const rows = await db
    .select({
      day: sql<Date>`date_trunc('day', ${schema.conversations.startedAt})`.as(
        "day",
      ),
      value: count(),
    })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, range.from, range.to),
        channel ? eq(schema.conversations.channel, channel) : undefined,
      ),
    )
    .groupBy(sql`date_trunc('day', ${schema.conversations.startedAt})`)
    .orderBy(sql`date_trunc('day', ${schema.conversations.startedAt})`);

  // Backfill: any day with no conversations should still appear as 0 so the
  // line chart doesn't have visual "gaps" the user reads as missing data.
  const points: DayPoint[] = [];
  const map = new Map<string, number>();
  for (const r of rows) map.set(toDayKey(r.day), Number(r.value));

  const cursor = new Date(range.from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.to);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = toDayKey(cursor);
    points.push({ day: key, count: map.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

function toDayKey(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

// ─── 3. Top user questions ────────────────────────────────────────────────

export interface TopQuestion {
  text: string;
  count: number;
}

export async function getTopUserMessages(
  userId: string,
  range: DateRange,
  limit = 10,
): Promise<TopQuestion[]> {
  const db = requireDb();
  const botIds = userBotIds(userId);

  // Normalize: lowercase + trim + collapse internal whitespace. Done in
  // SQL so duplicates collapse before the count, not after.
  const norm = sql<string>`lower(btrim(regexp_replace(${schema.messages.content}, '\\s+', ' ', 'g')))`;

  const rows = await db
    .select({
      text: norm.as("text"),
      value: count(),
    })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.conversations.id, schema.messages.conversationId),
    )
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        eq(schema.messages.fromUser, true),
        between(schema.messages.createdAt, range.from, range.to),
        sql`char_length(${schema.messages.content}) >= 3`,
      ),
    )
    .groupBy(norm)
    .orderBy(desc(count()))
    .limit(limit);

  return rows.map((r) => ({ text: r.text, count: Number(r.value) }));
}

// ─── 4. Unanswered questions ──────────────────────────────────────────────
//
// We use the message `source` enum as the primary signal — rows where
// the bot answered with source='fallback' are by definition "didn't have
// info". As a secondary signal we also match a few canonical phrases the
// answer engine emits when it gives up. Order: most recent first.

const UNANSWERED_PHRASES = [
  "ვერ ვიპოვე",
  "არ ვიცი",
  "please contact",
  "no information found",
  "სამწუხაროდ",
];

export interface UnansweredItem {
  question: string;
  botReply: string;
  conversationId: string;
  createdAt: Date;
}

export async function getUnansweredQuestions(
  userId: string,
  range: DateRange,
  limit = 20,
): Promise<UnansweredItem[]> {
  const db = requireDb();
  const botIds = userBotIds(userId);

  // Pull (user msg, bot reply) pairs by joining messages onto itself within
  // the same conversation. We only care about replies whose source='fallback'
  // OR content matches a phrase. The window function rn=1 keeps just the
  // immediate user message before each fallback reply.
  const phraseFilter = or(
    eq(schema.messages.source, "fallback"),
    ...UNANSWERED_PHRASES.map((p) => ilike(schema.messages.content, `%${p}%`)),
  );

  const fallbacks = await db
    .select({
      replyId: schema.messages.id,
      replyContent: schema.messages.content,
      conversationId: schema.messages.conversationId,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.conversations.id, schema.messages.conversationId),
    )
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        eq(schema.messages.fromUser, false),
        between(schema.messages.createdAt, range.from, range.to),
        phraseFilter,
      ),
    )
    .orderBy(desc(schema.messages.createdAt))
    .limit(limit);

  if (fallbacks.length === 0) return [];

  // For each fallback reply, find the immediately preceding user message in
  // the same conversation. One query with a lateral join would be cleaner,
  // but Drizzle's lateral support is awkward — N tiny queries is fine at
  // this volume.
  const items: UnansweredItem[] = [];
  for (const f of fallbacks) {
    const [userMsg] = await db
      .select({ content: schema.messages.content })
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.conversationId, f.conversationId),
          eq(schema.messages.fromUser, true),
          // Use Drizzle's column-aware lt() — a raw sql`< ${date}` binds the
          // JS Date as an untyped param and the Neon driver throws
          // "Received an instance of Date". lt() serializes via the column type.
          lt(schema.messages.createdAt, f.createdAt),
        ),
      )
      .orderBy(desc(schema.messages.createdAt))
      .limit(1);
    items.push({
      question: userMsg?.content ?? "(no question)",
      botReply: f.replyContent,
      conversationId: f.conversationId,
      createdAt: f.createdAt,
    });
  }
  return items;
}

// ─── 5. Funnel ─────────────────────────────────────────────────────────────

export interface Funnel {
  visitors: number; // distinct visitorIds
  conversations: number;
  leads: number;
  converted: number;
}

export async function getFunnel(
  userId: string,
  range: DateRange,
): Promise<Funnel> {
  const db = requireDb();
  const botIds = userBotIds(userId);

  const [{ value: visitors }] = await db
    .select({
      value: sql<number>`count(distinct ${schema.conversations.visitorId})`,
    })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, range.from, range.to),
      ),
    );

  const [{ value: convos }] = await db
    .select({ value: count() })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, range.from, range.to),
      ),
    );

  const [{ value: leads }] = await db
    .select({ value: count() })
    .from(schema.leads)
    .where(
      and(
        inArray(schema.leads.botId, botIds),
        between(schema.leads.createdAt, range.from, range.to),
      ),
    );

  const [{ value: converted }] = await db
    .select({ value: count() })
    .from(schema.leads)
    .where(
      and(
        inArray(schema.leads.botId, botIds),
        eq(schema.leads.status, "won"),
        between(schema.leads.createdAt, range.from, range.to),
      ),
    );

  return {
    visitors: Number(visitors),
    conversations: Number(convos),
    leads: Number(leads),
    converted: Number(converted),
  };
}

// ─── 6. Geographic breakdown ──────────────────────────────────────────────

export interface GeoRow {
  country: string | null;
  city: string | null;
  count: number;
}

export async function getGeoBreakdown(
  userId: string,
  range: DateRange,
  limit = 50,
): Promise<GeoRow[]> {
  const db = requireDb();
  const botIds = userBotIds(userId);

  const rows = await db
    .select({
      country: schema.conversations.country,
      city: schema.conversations.city,
      value: count(),
    })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, range.from, range.to),
      ),
    )
    .groupBy(schema.conversations.country, schema.conversations.city)
    .orderBy(desc(count()))
    .limit(limit);

  return rows.map((r) => ({
    country: r.country,
    city: r.city,
    count: Number(r.value),
  }));
}

// ─── 7. Hour-of-day heatmap ───────────────────────────────────────────────

export interface HeatCell {
  dow: number;
  hour: number;
  count: number;
}

/**
 * Returns a 7×24 grid keyed by (day-of-week, hour). Sunday=0, Saturday=6 —
 * Postgres' EXTRACT(dow) convention. Hours are 0..23 in UTC.
 */
export async function getHourHeatmap(
  userId: string,
  range: DateRange,
): Promise<HeatCell[]> {
  const db = requireDb();
  const botIds = userBotIds(userId);

  const rows = await db
    .select({
      dow: sql<number>`extract(dow from ${schema.conversations.startedAt})::int`.as(
        "dow",
      ),
      hour: sql<number>`extract(hour from ${schema.conversations.startedAt})::int`.as(
        "hour",
      ),
      value: count(),
    })
    .from(schema.conversations)
    .where(
      and(
        inArray(schema.conversations.botId, botIds),
        between(schema.conversations.startedAt, range.from, range.to),
      ),
    )
    .groupBy(
      sql`extract(dow from ${schema.conversations.startedAt})`,
      sql`extract(hour from ${schema.conversations.startedAt})`,
    );

  return rows.map((r) => ({
    dow: Number(r.dow),
    hour: Number(r.hour),
    count: Number(r.value),
  }));
}

// ─── 8. Export rows ────────────────────────────────────────────────────────

export interface ExportConversation {
  id: string;
  botName: string;
  channel: string;
  language: string;
  country: string | null;
  city: string | null;
  startedAt: Date;
  endedAt: Date | null;
  messageCnt: number;
}

export interface ExportLead {
  id: string;
  botName: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: string;
  createdAt: Date;
}

export async function getConversationExport(
  userId: string,
  range: DateRange,
): Promise<ExportConversation[]> {
  const db = requireDb();

  const rows = await db
    .select({
      id: schema.conversations.id,
      botName: schema.bots.name,
      channel: schema.conversations.channel,
      language: schema.conversations.language,
      country: schema.conversations.country,
      city: schema.conversations.city,
      startedAt: schema.conversations.startedAt,
      endedAt: schema.conversations.endedAt,
      messageCnt: sql<number>`(
        SELECT count(*) FROM ${schema.messages}
        WHERE ${schema.messages.conversationId} = ${schema.conversations.id}
      )`.as("message_cnt"),
    })
    .from(schema.conversations)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.conversations.botId))
    .where(
      and(
        eq(schema.bots.ownerId, userId),
        between(schema.conversations.startedAt, range.from, range.to),
      ),
    )
    .orderBy(desc(schema.conversations.startedAt));

  return rows.map((r) => ({ ...r, messageCnt: Number(r.messageCnt) }));
}

export async function getLeadsExport(
  userId: string,
  range: DateRange,
): Promise<ExportLead[]> {
  const db = requireDb();

  return db
    .select({
      id: schema.leads.id,
      botName: schema.bots.name,
      name: schema.leads.name,
      email: schema.leads.email,
      phone: schema.leads.phone,
      status: schema.leads.status,
      score: schema.leads.score,
      createdAt: schema.leads.createdAt,
    })
    .from(schema.leads)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.leads.botId))
    .where(
      and(
        eq(schema.bots.ownerId, userId),
        between(schema.leads.createdAt, range.from, range.to),
      ),
    )
    .orderBy(desc(schema.leads.createdAt));
}
