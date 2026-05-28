// /api/bots/[id]/knowledge/uploads — owner-scoped CRUD for uploaded
// document knowledge (Feature #9).
//
// POST   multipart/form-data — file field "file". Stores the raw file in
//        Vercel Blob, extracts text via pdf-parse / mammoth, chunks at
//        ~500 tokens, embeds via Voyage, persists with source='upload'.
//
// GET    list distinct uploads for this bot — { filename, chunkCount,
//        blobUrl, uploadedAt } so the dashboard can show a manageable
//        file list rather than every chunk row.
//
// DELETE body { filename: string } — removes every chunk for that
//        upload AND the blob from storage. Owner-only.

import { and, eq, sql, desc, max } from 'drizzle-orm';
import { put, del } from '@vercel/blob';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { getOrCreateSubscription } from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';
import { embedBatch, isEmbeddingsAvailable } from '@/lib/embeddings';
import { setChunkEmbeddings } from '@/db/queries/chunks';
import { extractText, inferMime, chunkText } from '@/lib/document-extract';

export const runtime  = 'nodejs';
export const maxDuration = 90;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per brief

async function ownsBot(userId: string, botId: string): Promise<boolean> {
  const db = requireDb();
  const row = await db.query.bots.findFirst({
    where: and(eq(schema.bots.id, botId), eq(schema.bots.ownerId, userId)),
    columns: { id: true },
  });
  return !!row;
}

// ── GET ────────────────────────────────────────────────────────────────────

export const GET = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  const db = requireDb();
  const rows = await db
    .select({
      filename:   schema.knowledgeChunks.filename,
      blobUrl:    schema.knowledgeChunks.blobUrl,
      chunkCount: sql<number>`count(*)::int`,
      uploadedAt: max(schema.knowledgeChunks.createdAt),
    })
    .from(schema.knowledgeChunks)
    .where(and(
      eq(schema.knowledgeChunks.botId, params.id),
      eq(schema.knowledgeChunks.source, 'upload'),
    ))
    .groupBy(schema.knowledgeChunks.filename, schema.knowledgeChunks.blobUrl)
    .orderBy(desc(max(schema.knowledgeChunks.createdAt)));

  return { ok: true, uploads: rows };
});

// ── POST ───────────────────────────────────────────────────────────────────

export const POST = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  // Plan limit — the same chunksPerBot cap applies to uploaded chunks.
  const sub    = await getOrCreateSubscription(user.id);
  const limits = getLimits(sub.plan);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, 'INVALID_MULTIPART');

  const file = form.get('file');
  if (!(file instanceof Blob)) return jsonError(400, 'MISSING_FILE');
  const rawName = 'name' in file && typeof (file as File).name === 'string'
    ? (file as File).name
    : 'document';
  // Strip path separators + control chars + leading dots so the blob path
  // can't be tricked into escaping bots/<id>/knowledge/.
  const filename = rawName
    .replace(/[\\/]/g, '_')
    .replace(/[\x00-\x1f]/g, '')
    .replace(/^\.+/, '')
    .slice(0, 200) || 'document';
  if (file.size > MAX_BYTES) return jsonError(413, 'FILE_TOO_LARGE', 'Max 10 MB.');

  const mime = inferMime(filename);
  if (!mime) return jsonError(415, 'UNSUPPORTED_TYPE', 'Only .pdf, .docx, .txt are accepted.');

  // 1. Upload to Vercel Blob first — gives us a stable URL for later
  //    re-processing or download.
  const bytes = Buffer.from(await file.arrayBuffer());
  let blobUrl = '';
  try {
    const result = await put(
      `bots/${params.id}/knowledge/${Date.now()}-${filename}`,
      bytes,
      { access: 'public', contentType: mime, addRandomSuffix: false },
    );
    blobUrl = result.url;
  } catch (e) {
    console.error('[knowledge/upload] blob put failed:', e);
    return jsonError(502, 'BLOB_UPLOAD_FAILED');
  }

  // 2. Extract text.
  let text = '';
  try {
    text = await extractText(bytes, mime);
  } catch (e) {
    console.error('[knowledge/upload] extract failed:', e);
    // Best-effort cleanup: leave the blob in place so the owner can retry.
    return jsonError(422, 'EXTRACT_FAILED');
  }
  if (!text.trim()) return jsonError(422, 'NO_TEXT_FOUND');

  // 3. Chunk + cap by plan limits.
  const db = requireDb();
  const existingCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.knowledgeChunks)
    .where(eq(schema.knowledgeChunks.botId, params.id));
  const headroom = Math.max(0, limits.chunksPerBot - (existingCount[0]?.c ?? 0));
  if (headroom === 0) return jsonError(402, 'CHUNK_LIMIT_REACHED');

  const chunks = chunkText(text).slice(0, headroom);
  if (chunks.length === 0) return jsonError(422, 'EMPTY_CHUNKS');

  // 4. Persist.
  const inserted = await db.insert(schema.knowledgeChunks).values(
    chunks.map(c => ({
      botId:    params.id,
      heading:  `${filename} — ${c.heading}`,
      content:  c.content,
      keywords: [],
      source:   'upload' as const,
      filename,
      blobUrl,
    })),
  ).returning({
    id: schema.knowledgeChunks.id,
    heading: schema.knowledgeChunks.heading,
    content: schema.knowledgeChunks.content,
  });

  // 5. Embed AFTER the rows are visible — same pattern as recrawl.
  let embedded = 0;
  if (isEmbeddingsAvailable() && inserted.length > 0) {
    try {
      const texts = inserted.map(r => `${r.heading}\n${r.content}`.slice(0, 8000));
      const embeddings = await embedBatch(texts, 'document');
      if (embeddings) {
        await setChunkEmbeddings(inserted.map((r, i) => ({ id: r.id, embedding: embeddings[i] })));
        embedded = embeddings.length;
      }
    } catch (e) {
      console.error('[knowledge/upload] embed failed:', e);
    }
  }

  return {
    ok: true,
    filename,
    blobUrl,
    chunkCount: chunks.length,
    embedded,
  };
});

// ── DELETE ─────────────────────────────────────────────────────────────────

export const DELETE = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: { filename?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }
  const filename = typeof body.filename === 'string' ? body.filename : '';
  if (!filename) return jsonError(400, 'MISSING_FILENAME');

  const db = requireDb();

  // Grab the blob URL before we delete the rows so we can clean storage.
  const urls = await db
    .select({ blobUrl: schema.knowledgeChunks.blobUrl })
    .from(schema.knowledgeChunks)
    .where(and(
      eq(schema.knowledgeChunks.botId, params.id),
      eq(schema.knowledgeChunks.filename, filename),
    ))
    .limit(1);
  const blobUrl = urls[0]?.blobUrl ?? null;

  await db.delete(schema.knowledgeChunks).where(and(
    eq(schema.knowledgeChunks.botId, params.id),
    eq(schema.knowledgeChunks.filename, filename),
    eq(schema.knowledgeChunks.source, 'upload'),
  ));

  if (blobUrl) {
    try { await del(blobUrl); }
    catch (e) { console.warn('[knowledge/upload] blob delete failed:', e); }
  }

  return { ok: true };
});
