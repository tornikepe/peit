// Knowledge-chunk queries: vector similarity search + bulk embedding update.

import { eq, sql } from 'drizzle-orm';
import { requireDb, schema } from '@/db';
import { toPgVector } from '@/lib/embeddings';

export interface RetrievedChunk {
  id:       string;
  heading:  string;
  content:  string;
  keywords: string[];
  /** Cosine similarity ∈ [0, 1] — higher is more similar. */
  score:    number;
}

/**
 * Vector similarity search over a single bot's chunks.
 * Returns top-K by cosine similarity. Empty result if no chunks are
 * embedded yet (callers should fall back to keyword search).
 */
export async function searchChunksByVector(
  botId: string,
  queryEmbedding: number[],
  limit = 5,
  minSimilarity = 0.3,
): Promise<RetrievedChunk[]> {
  const db = requireDb();
  const vectorLiteral = toPgVector(queryEmbedding);

  // Cosine similarity = 1 - cosine_distance.
  // Operator `<=>` is cosine distance (lower = closer).
  const rows = await db.execute<{
    id:       string;
    heading:  string;
    content:  string;
    keywords: string[];
    score:    number;
  }>(sql`
    SELECT
      id, heading, content, keywords,
      (1 - (embedding <=> ${vectorLiteral}::vector))::float8 AS score
    FROM ${schema.knowledgeChunks}
    WHERE bot_id = ${botId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `);

  return (rows as unknown as RetrievedChunk[]).filter(r => r.score >= minSimilarity);
}

/**
 * Persist embeddings for a list of chunks. Run after Voyage returns vectors.
 * Operates one row at a time (vector parameter binding through Drizzle is
 * fiddly — small N anyway).
 */
export async function setChunkEmbeddings(
  pairs: { id: string; embedding: number[] }[],
): Promise<void> {
  if (pairs.length === 0) return;
  const db = requireDb();

  for (const { id, embedding } of pairs) {
    const v = toPgVector(embedding);
    await db.execute(sql`
      UPDATE ${schema.knowledgeChunks}
      SET embedding = ${v}::vector
      WHERE id = ${id}
    `);
  }
}

/** How many chunks does this bot have without embeddings? */
export async function countChunksMissingEmbeddings(botId: string): Promise<number> {
  const db = requireDb();
  const rows = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM ${schema.knowledgeChunks}
    WHERE bot_id = ${botId}
      AND embedding IS NULL
  `);
  return Number((rows as unknown as { count: number }[])[0]?.count ?? 0);
}

/** All chunks for a bot, regardless of embedding status. */
export async function listChunks(botId: string) {
  const db = requireDb();
  return await db.query.knowledgeChunks.findMany({
    where: eq(schema.knowledgeChunks.botId, botId),
  });
}
