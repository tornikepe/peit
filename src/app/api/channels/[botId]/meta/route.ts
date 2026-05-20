// Channel attach/detach for Meta-backed channels (Instagram, Facebook).
//
// POST   /api/channels/[botId]/meta       { kind, code, redirectUri, pageId }
//        → completes OAuth + attaches a specific page to the bot.
//          `kind` ∈ {"instagram","facebook"} controls which sender API
//          we'll route through.
// GET    /api/channels/[botId]/meta/auth-url?kind=...
//        → kicks off the OAuth flow with a freshly-stamped `state`
//          (handled in a sibling file).
// DELETE /api/channels/[botId]/meta?kind=...
//        → disconnect (drops credentials, status='disconnected').
//
// Until Meta App Review approves pages_messaging and (for IG)
// instagram_manage_messages, completing the flow only works for users
// added as developers/testers in App Dashboard. The route still ships so
// reviewers and the dev team can exercise the path end-to-end.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { getBotForUser } from '@/db/queries/bots';
import {
  upsertChannel, disconnectChannel, getChannel,
} from '@/db/queries/channels';
import {
  isMetaAvailable, exchangeAuthCode, extendUserToken, listUserPages, getPageInfo,
  MetaApiError,
} from '@/lib/meta';
import type { MetaChannelCreds } from '@/db/schema';

export const runtime = 'nodejs';

type Kind = 'instagram' | 'facebook';

function parseKind(s: unknown): Kind | null {
  return s === 'instagram' || s === 'facebook' ? s : null;
}

interface ConnectBody {
  kind?:        unknown;
  code?:        unknown;
  redirectUri?: unknown;
  pageId?:      unknown;
}

export const POST = withAuth<{ botId: string }>(async ({ user, req, params }) => {
  if (!isMetaAvailable()) {
    return jsonError(503, 'META_NOT_CONFIGURED',
      'Set META_APP_ID + META_APP_SECRET to enable Meta channels.');
  }
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  let body: ConnectBody;
  try { body = await req.json() as ConnectBody; }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const kind        = parseKind(body.kind);
  const code        = typeof body.code === 'string' ? body.code.trim() : '';
  const redirectUri = typeof body.redirectUri === 'string' ? body.redirectUri : '';
  const pageId      = typeof body.pageId === 'string' ? body.pageId : '';

  if (!kind)        return jsonError(400, 'INVALID_KIND');
  if (!code)        return jsonError(400, 'MISSING_CODE');
  if (!redirectUri) return jsonError(400, 'MISSING_REDIRECT');
  if (!pageId)      return jsonError(400, 'MISSING_PAGE_ID');

  // Step 1: short-lived user token from the OAuth code.
  let shortLived;
  try { shortLived = await exchangeAuthCode(code, redirectUri); }
  catch (e) {
    if (e instanceof MetaApiError && e.status === 400) {
      return jsonError(400, 'INVALID_CODE',
        'Meta rejected the auth code — it may have expired. Re-start the connection flow.');
    }
    return jsonError(502, 'META_API_ERROR', e instanceof Error ? e.message : 'exchange failed');
  }

  // Step 2: upgrade to a long-lived user token (≈60d).
  let longLived;
  try { longLived = await extendUserToken(shortLived.access_token); }
  catch (e) {
    return jsonError(502, 'META_API_ERROR',
      `Token extension failed: ${e instanceof Error ? e.message : ''}`);
  }

  // Step 3: pull the user's pages and locate the one they selected.
  const pages = await listUserPages(longLived.access_token).catch(e => {
    console.error('[channels/meta] listUserPages failed:', e);
    return [];
  });
  const page = pages.find(p => p.id === pageId);
  if (!page) {
    return jsonError(403, 'PAGE_NOT_ACCESSIBLE',
      'The selected page is not managed by this account — pick another or reconnect.');
  }

  // Step 4: for Instagram channels make sure the page has an IG business
  // account attached, otherwise IG Messaging will reject the sends.
  let igBusinessId: string | undefined;
  if (kind === 'instagram') {
    const info = await getPageInfo(page.id, page.access_token).catch(() => null);
    igBusinessId = info?.instagram_business_account?.id;
    if (!igBusinessId) {
      return jsonError(400, 'NO_IG_ACCOUNT',
        'This page has no connected Instagram business account.');
    }
  }

  // Step 5: persist. We store the PAGE access token (not the user token) —
  // that's what the messaging APIs require and it's the long-lived flavour
  // returned by /me/accounts. Tokens here typically last until the user
  // revokes app access.
  const creds: MetaChannelCreds = {
    pageId:           page.id,
    pageAccessToken:  page.access_token,
    pageName:         page.name,
    igBusinessId,
    tokenRefreshedAt: new Date().toISOString(),
  };
  await upsertChannel(bot.id, kind, creds as unknown as Record<string, unknown>);

  return { ok: true, pageId: page.id, pageName: page.name, igBusinessId: igBusinessId ?? null };
});

export const DELETE = withAuth<{ botId: string }>(async ({ user, req, params }) => {
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');
  const kind = parseKind(new URL(req.url).searchParams.get('kind'));
  if (!kind) return jsonError(400, 'INVALID_KIND');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  const existing = await getChannel(bot.id, kind);
  if (!existing) return { ok: true, alreadyDisconnected: true };

  await disconnectChannel(bot.id, kind);
  return { ok: true };
});
