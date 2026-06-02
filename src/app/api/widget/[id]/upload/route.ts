// POST /api/widget/[id]/upload — public, CORS-enabled (Feature #3).
// A visitor attaches a file in the chat widget; we validate it, store it in
// Vercel Blob (private), and return a reference the widget puts on its next
// message. The /stream route later re-reads the bytes to feed Claude vision
// (images) or extract text (documents).

import { put } from '@vercel/blob';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';
import { getDb, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function OPTIONS() { return corsPreflight(); }

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Accepted types → (kind, canonical mime). Keyed by file extension since
// browsers report inconsistent mime types for some formats.
const ACCEPT: Record<string, { kind: 'image' | 'document'; mime: string }> = {
  jpg:  { kind: 'image',    mime: 'image/jpeg' },
  jpeg: { kind: 'image',    mime: 'image/jpeg' },
  png:  { kind: 'image',    mime: 'image/png' },
  gif:  { kind: 'image',    mime: 'image/gif' },
  webp: { kind: 'image',    mime: 'image/webp' },
  pdf:  { kind: 'document', mime: 'application/pdf' },
  docx: { kind: 'document', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: botId } = await params;
  if (!botId) return corsError(400, 'MISSING_BOT_ID');

  // The bot must exist + be active for uploads to be accepted.
  const db = getDb();
  if (db) {
    const bot = await db.query.bots.findFirst({
      where: eq(schema.bots.id, botId),
      columns: { id: true, status: true },
    });
    if (!bot) return corsError(404, 'BOT_NOT_FOUND');
    if (bot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');
  }

  // Rate-limit uploads per IP — 20 / 10 min.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(rateLimitKey(['upload', ip]), 20, 600);
  if (!rl.allowed) return corsError(429, 'RATE_LIMITED');

  const form = await req.formData().catch(() => null);
  if (!form) return corsError(400, 'INVALID_MULTIPART');
  const file = form.get('file');
  if (!(file instanceof Blob)) return corsError(400, 'MISSING_FILE');

  const filename = ('name' in file && typeof (file as File).name === 'string')
    ? (file as File).name : 'file';
  if (file.size > MAX_BYTES) return corsError(413, 'FILE_TOO_LARGE', 'Max 10 MB.');

  const ext = filename.toLowerCase().split('.').pop() ?? '';
  const accept = ACCEPT[ext];
  if (!accept) {
    return corsError(415, 'UNSUPPORTED_TYPE', 'Allowed: jpg, png, gif, webp, pdf, docx.');
  }

  const pathname = `chat/${botId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await put(pathname, bytes, {
      access: 'private',
      contentType: accept.mime,
      addRandomSuffix: false,
    });
    return corsJson({
      ok: true,
      attachment: {
        url:      result.url,
        pathname: result.pathname,
        filename,
        mimeType: accept.mime,
        kind:     accept.kind,
      },
    });
  } catch (e) {
    console.error('[widget/upload] blob put failed:', e);
    return corsError(502, 'UPLOAD_FAILED', e instanceof Error ? e.message : undefined);
  }
}
