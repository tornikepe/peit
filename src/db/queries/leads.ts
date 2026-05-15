// Lead-list queries for the dashboard.
//
// All public functions enforce ownership via a bot join — a user can only
// read or mutate leads attached to bots they own. The widget endpoint
// (POST /api/widget/[id]/lead) writes leads directly; everything else
// goes through here.

import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requireDb, schema } from '@/db';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
export type LeadScore  = 'cold' | 'warm' | 'hot';

export interface DashboardLead {
  id:        string;
  botId:     string;
  botName:   string;
  name:      string | null;
  email:     string | null;
  phone:     string | null;
  message:   string | null;
  status:    LeadStatus;
  score:     LeadScore;
  createdAt: Date;
}

export interface LeadFilters {
  botId?:  string;       // restrict to a single bot
  status?: LeadStatus;   // restrict by lifecycle status
  score?:  LeadScore;    // restrict by hot/warm/cold
  search?: string;       // ILIKE over name / email / phone / message
  limit?:  number;       // pagination
  offset?: number;
}

/**
 * Build a single WHERE clause that:
 *   1. scopes to bots owned by `userId` (cross-tenant safety)
 *   2. applies the optional filters
 *
 * Used by both the paginated list and the CSV export so they always
 * agree on what counts as "this user's leads".
 */
function buildWhere(userId: string, filters: LeadFilters) {
  const clauses = [
    sql`${schema.bots.ownerId} = ${userId}`,
  ];

  if (filters.botId) {
    clauses.push(sql`${schema.leads.botId} = ${filters.botId}`);
  }
  if (filters.status) {
    clauses.push(sql`${schema.leads.status} = ${filters.status}`);
  }
  if (filters.score) {
    clauses.push(sql`${schema.leads.score} = ${filters.score}`);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    // Cast each candidate to text so Drizzle's parameterizer doesn't trip
    // on the varchar columns when search is empty.
    clauses.push(
      or(
        ilike(schema.leads.name,    term),
        ilike(schema.leads.email,   term),
        ilike(schema.leads.phone,   term),
        ilike(schema.leads.message, term),
      )!,
    );
  }
  return and(...clauses);
}

/**
 * Paginated dashboard list. Joins bots for the display name and to
 * enforce ownership in one round-trip.
 */
export async function listLeadsForUser(
  userId: string,
  filters: LeadFilters = {},
): Promise<DashboardLead[]> {
  const db = requireDb();
  const limit  = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  const rows = await db
    .select({
      id:        schema.leads.id,
      botId:     schema.leads.botId,
      botName:   schema.bots.name,
      name:      schema.leads.name,
      email:     schema.leads.email,
      phone:     schema.leads.phone,
      message:   schema.leads.message,
      status:    schema.leads.status,
      score:     schema.leads.score,
      createdAt: schema.leads.createdAt,
    })
    .from(schema.leads)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.leads.botId))
    .where(buildWhere(userId, filters))
    .orderBy(desc(schema.leads.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(r => ({
    id:        r.id,
    botId:     r.botId,
    botName:   r.botName,
    name:      r.name,
    email:     r.email,
    phone:     r.phone,
    message:   r.message,
    status:    r.status as LeadStatus,
    score:     r.score as LeadScore,
    createdAt: r.createdAt,
  }));
}

/** Total count for pagination — uses the same WHERE as listLeadsForUser. */
export async function countLeadsForUser(
  userId: string,
  filters: LeadFilters = {},
): Promise<number> {
  const db = requireDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.leads)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.leads.botId))
    .where(buildWhere(userId, filters));
  return count ?? 0;
}

/**
 * Update a lead's lifecycle status. Returns false (404) if the lead
 * doesn't belong to a bot the user owns.
 */
export async function updateLeadStatus(
  userId: string,
  leadId: string,
  status: LeadStatus,
): Promise<boolean> {
  const db = requireDb();

  // Verify ownership via join before mutating.
  const owned = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.leads.botId))
    .where(and(
      eq(schema.leads.id, leadId),
      eq(schema.bots.ownerId, userId),
    ))
    .limit(1);

  if (owned.length === 0) return false;

  await db
    .update(schema.leads)
    .set({ status })
    .where(eq(schema.leads.id, leadId));

  return true;
}

/** Unpaginated export — same filters, no limit. Used by /api/leads/export.csv */
export async function exportLeadsForUser(
  userId: string,
  filters: Omit<LeadFilters, 'limit' | 'offset'> = {},
): Promise<DashboardLead[]> {
  return listLeadsForUser(userId, { ...filters, limit: 10_000, offset: 0 });
}

/** Aggregate counts per status — used by the dashboard filter pills. */
export async function countLeadsByStatus(
  userId: string,
): Promise<Record<LeadStatus | 'total', number>> {
  const db = requireDb();
  const rows = await db
    .select({
      status: schema.leads.status,
      count:  sql<number>`count(*)::int`,
    })
    .from(schema.leads)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.leads.botId))
    .where(eq(schema.bots.ownerId, userId))
    .groupBy(schema.leads.status);

  const result: Record<LeadStatus | 'total', number> = {
    new: 0, contacted: 0, qualified: 0, won: 0, lost: 0, total: 0,
  };
  for (const r of rows) {
    result[r.status as LeadStatus] = r.count;
    result.total += r.count;
  }
  return result;
}

/** Aggregate counts per score — for cold/warm/hot filter chips. */
export async function countLeadsByScore(
  userId: string,
): Promise<Record<LeadScore, number>> {
  const db = requireDb();
  const rows = await db
    .select({
      score: schema.leads.score,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.leads)
    .innerJoin(schema.bots, eq(schema.bots.id, schema.leads.botId))
    .where(eq(schema.bots.ownerId, userId))
    .groupBy(schema.leads.score);

  const result: Record<LeadScore, number> = { cold: 0, warm: 0, hot: 0 };
  for (const r of rows) result[r.score as LeadScore] = r.count;
  return result;
}
