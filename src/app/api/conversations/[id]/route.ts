// GET   /api/conversations/[id]            → full transcript
// PATCH /api/conversations/[id]            → { tags?, isHandedOff? }
//
// Both endpoints reject quietly when the caller doesn't own the bot the
// conversation belongs to (404 BOT_NOT_FOUND — same as missing row), so
// the URL space leaks no ownership info.

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  getConversationDetail, patchConversation,
} from '@/db/queries/conversations';

export const runtime = 'nodejs';

export const GET = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');

  const detail = await getConversationDetail(user.id, params.id);
  if (!detail) return jsonError(404, 'NOT_FOUND');

  return {
    conversation: {
      id:           detail.id,
      botId:        detail.botId,
      botName:      detail.botName,
      channel:      detail.channel,
      language:     detail.language,
      country:      detail.country,
      city:         detail.city,
      tags:         detail.tags,
      isHandedOff:  detail.isHandedOff,
      handedOffAt:  detail.handedOffAt?.toISOString() ?? null,
      startedAt:    detail.startedAt.toISOString(),
      endedAt:      detail.endedAt?.toISOString() ?? null,
      metadata:     detail.metadata,
      messages:     detail.messages.map(m => ({
        id:        m.id,
        role:      m.role,
        content:   m.content,
        source:    m.source,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  };
});

export const PATCH = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');

  let body: { tags?: unknown; isHandedOff?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const patch: { tags?: string[]; isHandedOff?: boolean } = {};

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some(t => typeof t !== 'string')) {
      return jsonError(400, 'INVALID_TAGS', 'tags must be an array of strings');
    }
    patch.tags = (body.tags as string[]);
  }

  if (body.isHandedOff !== undefined) {
    if (typeof body.isHandedOff !== 'boolean') {
      return jsonError(400, 'INVALID_HANDOFF', 'isHandedOff must be a boolean');
    }
    patch.isHandedOff = body.isHandedOff;
  }

  if (patch.tags === undefined && patch.isHandedOff === undefined) {
    return jsonError(400, 'EMPTY_PATCH');
  }

  const ok = await patchConversation(user.id, params.id, patch);
  if (!ok) return jsonError(404, 'NOT_FOUND');

  // Re-read so the client gets the canonical state (tags after dedup,
  // handedOffAt stamped server-side).
  const detail = await getConversationDetail(user.id, params.id);
  if (!detail) return jsonError(404, 'NOT_FOUND');

  return {
    ok:           true,
    tags:         detail.tags,
    isHandedOff:  detail.isHandedOff,
    handedOffAt:  detail.handedOffAt?.toISOString() ?? null,
  };
});
