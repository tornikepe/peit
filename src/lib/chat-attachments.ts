// Resolve chat attachments (Feature #3) into LLM-ready inputs.
//
// The widget uploaded files to a PRIVATE Vercel Blob store and sent only
// references on the message. Here we re-read each blob server-side (so we
// never trust client-supplied bytes/text) and turn it into:
//   - images   → base64 for Claude vision
//   - documents → extracted text injected as context
//
// Best-effort: any single attachment that fails to read is skipped, never
// breaking the reply.

import { get } from '@vercel/blob';
import type { MessageAttachment } from '@/db';
import { extractText, type DocMime } from '@/lib/document-extract';

export interface ResolvedAttachments {
  images:  { mediaType: string; data: string }[];
  docText: string;
}

const VISION_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

async function readBytes(att: MessageAttachment): Promise<Buffer | null> {
  try {
    // get() streams the private blob's bytes directly (statusCode 200).
    const res = await get(att.pathname, { access: 'private' });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  } catch (e) {
    console.warn('[chat-attachments] read failed:', att.pathname, e);
    return null;
  }
}

export async function resolveAttachments(
  attachments: MessageAttachment[] | undefined,
): Promise<ResolvedAttachments> {
  const images: { mediaType: string; data: string }[] = [];
  const docParts: string[] = [];
  if (!attachments?.length) return { images, docText: '' };

  // Cap how many we process so a flood can't blow up the request.
  for (const att of attachments.slice(0, 5)) {
    const bytes = await readBytes(att);
    if (!bytes) continue;

    if (att.kind === 'image' && VISION_MIMES.has(att.mimeType)) {
      images.push({ mediaType: att.mimeType, data: bytes.toString('base64') });
    } else if (att.kind === 'document') {
      try {
        const text = await extractText(bytes, att.mimeType as DocMime);
        if (text.trim()) docParts.push(`--- ${att.filename} ---\n${text.trim().slice(0, 6000)}`);
      } catch (e) {
        console.warn('[chat-attachments] extract failed:', att.filename, e);
      }
    }
  }

  return { images, docText: docParts.join('\n\n') };
}

/**
 * Lightweight server-side validation of the client-sent attachment refs.
 *
 * SECURITY: the pathname must live under this bot's own upload prefix
 * (`chat/<botId>/`). The upload endpoint always writes there, so this rejects
 * a crafted ref that points at another tenant's private blob (cross-tenant
 * read). Pass the bot id from the route to enforce it.
 */
export function sanitizeAttachments(raw: unknown, botId?: string): MessageAttachment[] {
  if (!Array.isArray(raw)) return [];
  const prefix = botId ? `chat/${botId}/` : null;
  const out: MessageAttachment[] = [];
  for (const a of raw.slice(0, 5)) {
    if (!a || typeof a !== 'object') continue;
    const o = a as Record<string, unknown>;
    if (typeof o.url !== 'string' || typeof o.pathname !== 'string') continue;
    if (o.kind !== 'image' && o.kind !== 'document') continue;
    // Reject refs that don't belong to this bot's own upload folder.
    if (prefix && !o.pathname.startsWith(prefix)) continue;
    out.push({
      url:      o.url.slice(0, 1000),
      pathname: o.pathname.slice(0, 500),
      filename: typeof o.filename === 'string' ? o.filename.slice(0, 200) : 'file',
      mimeType: typeof o.mimeType === 'string' ? o.mimeType.slice(0, 100) : 'application/octet-stream',
      kind:     o.kind,
    });
  }
  return out;
}
