// GET /api/conversations
//
// Query params:
//   search   — free-text, ILIKE against any message in the conversation
//   tag      — exact tag membership match
//   channel  — web | telegram | instagram | facebook
//   page     — 1-based, default 1
//   limit    — default 20, max 100
//
// Returns: { conversations: [...], total, page, limit }

import { withAuth, jsonError } from '@/app/api/_helpers';
import { listConversations, listAllTagsForUser } from '@/db/queries/conversations';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user, req }) => {
  const url   = new URL(req.url);
  const page  = Math.max(1, Number(url.searchParams.get('page'))  || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));

  const channelParam = url.searchParams.get('channel') ?? undefined;
  const channel =
    channelParam === 'web' || channelParam === 'telegram'
      || channelParam === 'instagram' || channelParam === 'facebook'
    ? channelParam
    : undefined;

  // ?withTags=1 → also return the global tag list so the filter dropdown
  // can populate without a second round-trip. Optional because the typical
  // pagination poll doesn't need it.
  const withTags = url.searchParams.get('withTags') === '1';

  try {
    const { rows, total } = await listConversations({
      userId:  user.id,
      search:  url.searchParams.get('search') ?? undefined,
      tag:     url.searchParams.get('tag')    ?? undefined,
      channel,
      page, limit,
    });

    const allTags = withTags ? await listAllTagsForUser(user.id) : undefined;

    return {
      conversations: rows.map(r => ({
        id:           r.id,
        botId:        r.botId,
        botName:      r.botName,
        channel:      r.channel,
        language:     r.language,
        country:      r.country,
        city:         r.city,
        tags:         r.tags,
        isHandedOff:  r.isHandedOff,
        handedOffAt:  r.handedOffAt?.toISOString() ?? null,
        startedAt:    r.startedAt.toISOString(),
        endedAt:      r.endedAt?.toISOString() ?? null,
        messageCount: r.messageCount,
      })),
      total,
      page,
      limit,
      ...(allTags ? { allTags } : {}),
    };
  } catch (e) {
    console.error('[api/conversations] list failed:', e);
    return jsonError(500, 'INTERNAL', e instanceof Error ? e.message : 'list failed');
  }
});
