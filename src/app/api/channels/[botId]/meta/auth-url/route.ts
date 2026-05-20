// GET /api/channels/[botId]/meta/auth-url?kind=instagram|facebook
//
// Returns the Meta-hosted authorization URL the dashboard should open
// in a new window. `state` is a signed bot ID + kind so the OAuth
// callback knows where to attach the resulting page token. The redirect
// URI is computed server-side so it always matches what's whitelisted in
// the Meta App Dashboard.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { getBotForUser } from '@/db/queries/bots';
import { isMetaAvailable, buildAuthUrl } from '@/lib/meta';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

function publicAppUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (env) return env;
  try { return new URL(req.url).origin; }
  catch { return 'http://localhost:3000'; }
}

/**
 * Build the `state` parameter: `${botId}.${kind}.${nonce}.${hmac}`.
 * Signed so a third party can't redirect the callback at someone else's
 * bot. CRON_SECRET reused as the signing key — already required for
 * production and never exposed to the client.
 */
function signState(botId: string, kind: 'instagram' | 'facebook'): string {
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) throw new Error('CRON_SECRET_NOT_SET');
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${botId}.${kind}.${nonce}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  return `${payload}.${hmac}`;
}

export const GET = withAuth<{ botId: string }>(async ({ user, req, params }) => {
  if (!isMetaAvailable()) {
    return jsonError(503, 'META_NOT_CONFIGURED');
  }
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  if (kind !== 'instagram' && kind !== 'facebook') {
    return jsonError(400, 'INVALID_KIND');
  }

  // Redirect URI MUST exactly match one whitelisted in App Dashboard →
  // Facebook Login → Valid OAuth Redirect URIs. We use the dashboard
  // callback page so the OAuth dance ends inside our SPA.
  const appUrl     = publicAppUrl(req);
  const redirectUri = `${appUrl}/dashboard/bots/${bot.id}/meta-callback`;

  const state = signState(bot.id, kind);
  const authUrl = buildAuthUrl({ redirectUri, state, scope: kind });

  return { authUrl, redirectUri, state };
});
