// POST /api/bots/[id]/reindex
// Re-embeds all knowledge chunks for a bot. Idempotent.

import { eq, and } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { embedBatch, isEmbeddingsAvailable } from '@/lib/embeddings';
import { setChunkEmbeddings } from '@/db/queries/chunks';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!isEmbeddingsAvailable()) {
    return jsonError(503, 'EMBEDDINGS_NOT_CONFIGURED', 'Set VOYAGE_API_KEY in env');
  }

  const db = requireDb();

  const bot = await db.query.bots.findFirst({
    where: and(eq(schema.bots.id, params.id), eq(schema.bots.ownerId, user.id)),
    columns: { id: true },
  });
  if (!bot) return jsonError(404, 'NOT_FOUND');

  const chunks = await db.query.knowledgeChunks.findMany({
    where: eq(schema.knowledgeChunks.botId, bot.id),
    columns: { id: true, heading: true, content: true },
  });

  if (chunks.length === 0) {
    return { ok: true, indexed: 0 };
  }

  const texts = chunks.map(c => `${c.heading}\n${c.content}`.slice(0, 8000));
  const embeddings = await embedBatch(texts, 'document');
  if (!embeddings) {
    return jsonError(502, 'EMBEDDING_FAILED', 'Voyage AI did not respond');
  }

  await setChunkEmbeddings(
    chunks.map((c, i) => ({ id: c.id, embedding: embeddings[i] })),
  );

  return { ok: true, indexed: chunks.length };
});
