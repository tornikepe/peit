// GET  /api/channels/[botId]            → list every connected channel
// POST /api/channels/[botId]/telegram   → connect (in separate route)
// DELETE see /api/channels/[botId]/[channel]/route.ts

import { withAuth, jsonError } from '@/app/api/_helpers';
import { getBotForUser } from '@/db/queries/bots';
import { listChannelsForBot } from '@/db/queries/channels';
import type { TelegramChannelCreds, MetaChannelCreds } from '@/db/schema';

export const runtime = 'nodejs';

/** Public-safe view of a channel row — never expose raw tokens to the UI. */
function maskedCredentials(channel: string, creds: unknown): Record<string, unknown> {
  if (channel === 'telegram') {
    const c = creds as Partial<TelegramChannelCreds>;
    return {
      botUsername: c.botUsername ?? null,
      tokenSet:    !!c.botToken,
    };
  }
  if (channel === 'instagram' || channel === 'facebook') {
    const c = creds as Partial<MetaChannelCreds>;
    return {
      pageName:        c.pageName ?? null,
      pageId:          c.pageId  ?? null,
      tokenSet:        !!c.pageAccessToken,
      igBusinessId:    c.igBusinessId ?? null,
    };
  }
  return {};
}

export const GET = withAuth<{ botId: string }>(async ({ user, params }) => {
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  const rows = await listChannelsForBot(bot.id);
  return {
    channels: rows.map(r => ({
      channel:        r.channel,
      status:         r.status,
      credentials:    maskedCredentials(r.channel, r.credentials),
      lastInboundAt:  r.lastInboundAt?.toISOString() ?? null,
      totalInbound:   r.totalInbound,
      lastError:      r.lastError,
      updatedAt:      r.updatedAt.toISOString(),
    })),
  };
});
