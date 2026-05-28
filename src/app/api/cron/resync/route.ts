// POST /api/cron/resync (Vercel Cron — daily)
//
// Sweeps every bot whose website knowledge is stale relative to its
// owner-configured cadence and re-runs the crawler. Lives next to
// trial-reminders/route.ts — same CRON_SECRET auth model, same maxDuration.
//
// Staleness rule: sync_interval_days > 0
//   AND (last_crawled_at IS NULL OR last_crawled_at < now - sync_interval_days days)
//
// We process bots serially to keep memory and external-API rate use sane.
// A per-bot try/catch isolates failures so one bad site doesn't kill the
// whole sweep.

import { NextResponse } from 'next/server';
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { analyzeSite, buildKnowledgeChunks } from '@/lib/scraper';
import { embedBatch, isEmbeddingsAvailable } from '@/lib/embeddings';
import { setChunkEmbeddings } from '@/db/queries/chunks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = req.headers.get('authorization');
  const url    = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get('secret') === secret;
}

export async function GET(req: Request)  { return handle(req); }
export async function POST(req: Request) { return handle(req); }

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });

  // Stale = enabled AND has a URL AND past the interval. We compare in
  // SQL so the date math runs server-side and we don't have to pull every
  // bot row up to Node.
  const stale = await db
    .select({
      id:           schema.bots.id,
      websiteUrl:   schema.bots.websiteUrl,
      intervalDays: schema.bots.syncIntervalDays,
    })
    .from(schema.bots)
    .where(and(
      gt(schema.bots.syncIntervalDays, 0),
      // websiteUrl is NOT NULL — Drizzle has no `isNotNull` shortcut here
      // but we can compare to '' which never matches for valid URLs.
      sql`${schema.bots.websiteUrl} IS NOT NULL AND ${schema.bots.websiteUrl} <> ''`,
      or(
        isNull(schema.bots.lastCrawledAt),
        // Postgres 10+ requires an explicit cast for int || text; without
        // the ::text the planner errors with "operator does not exist: int || text".
        sql`${schema.bots.lastCrawledAt} < now() - (${schema.bots.syncIntervalDays}::text || ' days')::interval`,
      ),
    ));

  const results: Array<{ botId: string; ok: boolean; error?: string; chunks?: number }> = [];
  for (const bot of stale) {
    if (!bot.websiteUrl) continue;
    try {
      const analysis = await analyzeSite(bot.websiteUrl);
      const chunks   = buildKnowledgeChunks(analysis).slice(0, 200);

      let inserted: { id: string; heading: string; content: string }[] = [];
      await db.transaction(async tx => {
        await tx.delete(schema.knowledgeChunks).where(eq(schema.knowledgeChunks.botId, bot.id));
        if (chunks.length) {
          inserted = await tx.insert(schema.knowledgeChunks).values(
            chunks.map(c => ({
              botId: bot.id, heading: c.heading, content: c.content, keywords: c.keywords,
            })),
          ).returning({
            id: schema.knowledgeChunks.id,
            heading: schema.knowledgeChunks.heading,
            content: schema.knowledgeChunks.content,
          });
        }
        await tx.update(schema.bots)
          .set({ lastCrawledAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.bots.id, bot.id));
      });

      if (isEmbeddingsAvailable() && inserted.length > 0) {
        try {
          const texts = inserted.map(r => `${r.heading}\n${r.content}`.slice(0, 8000));
          const embeddings = await embedBatch(texts, 'document');
          if (embeddings) {
            await setChunkEmbeddings(inserted.map((r, i) => ({ id: r.id, embedding: embeddings[i] })));
          }
        } catch (e) {
          console.error('[cron/resync] embed failed for', bot.id, e);
        }
      }

      results.push({ botId: bot.id, ok: true, chunks: chunks.length });
    } catch (e) {
      console.error('[cron/resync] bot failed:', bot.id, e);
      results.push({
        botId: bot.id, ok: false,
        error: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    ok: true,
    considered: stale.length,
    succeeded:  results.filter(r => r.ok).length,
    failed:     results.filter(r => !r.ok).length,
    results,
  });
}
