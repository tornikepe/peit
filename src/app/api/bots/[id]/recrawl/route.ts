// POST /api/bots/[id]/recrawl
// Re-runs the website analyzer on the bot's stored URL, replaces all
// knowledge chunks, re-embeds them, and updates lastCrawledAt.

import { eq, and } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { analyzeSite, buildKnowledgeChunks } from '@/lib/scraper';
import { embedBatch, isEmbeddingsAvailable } from '@/lib/embeddings';
import { setChunkEmbeddings } from '@/db/queries/chunks';
import { getOrCreateSubscription } from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';

export const runtime = 'nodejs';
export const maxDuration = 90;

export const POST = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');

  const db = requireDb();
  const bot = await db.query.bots.findFirst({
    where: and(eq(schema.bots.id, params.id), eq(schema.bots.ownerId, user.id)),
    columns: { id: true, websiteUrl: true },
  });
  if (!bot) return jsonError(404, 'NOT_FOUND');
  if (!bot.websiteUrl) {
    return jsonError(400, 'NO_WEBSITE_URL', 'This bot has no website URL configured.');
  }

  // Cap chunks by plan
  const sub = await getOrCreateSubscription(user.id);
  const limits = getLimits(sub.plan);

  // 1. Crawl
  let analysis;
  try {
    analysis = await analyzeSite(bot.websiteUrl);
  } catch (e) {
    return jsonError(422, 'CRAWL_FAILED', e instanceof Error ? e.message : 'Could not crawl site.');
  }

  // 2. Build chunks (truncated to plan limit)
  const chunks = buildKnowledgeChunks(analysis).slice(0, limits.chunksPerBot);

  // 3. Replace chunks in transaction (delete + insert)
  let insertedRows: { id: string; heading: string; content: string }[] = [];
  await db.transaction(async tx => {
    await tx.delete(schema.knowledgeChunks).where(eq(schema.knowledgeChunks.botId, bot.id));
    if (chunks.length) {
      const inserted = await tx.insert(schema.knowledgeChunks).values(
        chunks.map(c => ({
          botId:    bot.id,
          heading:  c.heading,
          content:  c.content,
          keywords: c.keywords,
        })),
      ).returning({ id: schema.knowledgeChunks.id, heading: schema.knowledgeChunks.heading, content: schema.knowledgeChunks.content });
      insertedRows = inserted;
    }
    await tx.update(schema.bots)
      .set({ lastCrawledAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.bots.id, bot.id));
  });

  // 4. Embed AFTER tx commits
  let embedded = 0;
  if (isEmbeddingsAvailable() && insertedRows.length > 0) {
    try {
      const texts = insertedRows.map(r => `${r.heading}\n${r.content}`.slice(0, 8000));
      const embeddings = await embedBatch(texts, 'document');
      if (embeddings) {
        await setChunkEmbeddings(insertedRows.map((r, i) => ({ id: r.id, embedding: embeddings[i] })));
        embedded = embeddings.length;
      }
    } catch (e) {
      console.error('[recrawl] embedding failed:', e);
    }
  }

  return {
    ok: true,
    pagesScraped:   analysis.pagesScraped,
    sitemapPages:   analysis.sitemapPages,
    chunksCreated:  chunks.length,
    embedded,
    detectedLang:   analysis.language,
  };
});
