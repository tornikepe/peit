// POST /api/channels/[botId]/meta-token
// Body: { kind: 'instagram' | 'facebook', pageId, pageAccessToken }
//
// Alternative Meta connection method — the customer pastes a Page Access
// Token they generated themselves in Meta Business Suite, skipping the
// OAuth dance entirely. This works without Peit owning a registered
// Meta App (the token is issued under whatever app the customer used
// in Business Suite — usually their own, or via Meta's built-in token
// generator).
//
// We validate the token by calling /me (basic identity probe) and, for
// Instagram channels, /{pageId}?fields=instagram_business_account to
// surface the IG account ID needed by the Messaging API.
//
// Tokens generated in Business Suite default to ~60-day lifetimes — the
// dashboard shows lastInboundAt so the operator can re-paste before it
// expires. A future "auto-refresh" job would extend long-lived user
// tokens, but it needs the OAuth-issued user token which isn't available
// here. Documented in .env.example.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { getBotForUser } from '@/db/queries/bots';
import { upsertChannel } from '@/db/queries/channels';
import type { MetaChannelCreds } from '@/db/schema';

export const runtime = 'nodejs';

const GRAPH_BASE = 'https://graph.facebook.com/v22.0';

type Kind = 'instagram' | 'facebook';

interface ConnectBody {
  kind?:            unknown;
  pageId?:          unknown;
  pageAccessToken?: unknown;
}

interface MeResponse {
  id:    string;
  name?: string;
}

interface PageWithIg {
  id:    string;
  name?: string;
  instagram_business_account?: { id: string };
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH_BASE}${path}?${qs}`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Graph ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export const POST = withAuth<{ botId: string }>(async ({ user, req, params }) => {
  if (!params.botId) return jsonError(400, 'MISSING_BOT_ID');

  const bot = await getBotForUser(user.id, params.botId);
  if (!bot) return jsonError(404, 'BOT_NOT_FOUND');

  let body: ConnectBody;
  try { body = await req.json() as ConnectBody; }
  catch { return jsonError(400, 'INVALID_JSON'); }

  // Tokens copy-pasted from Meta Business Suite sometimes arrive wrapped in
  // straight or smart quotes — strip them so the customer doesn't see a
  // confusing "INVALID_TOKEN_FORMAT" for what looks like a valid string.
  const unwrap = (s: string) => s.trim().replace(/^["'`“”„«»]+|["'`“”„«»]+$/g, '').trim();

  const kind   = body.kind === 'instagram' || body.kind === 'facebook' ? body.kind as Kind : null;
  const pageId = typeof body.pageId === 'string' ? unwrap(body.pageId) : '';
  const token  = typeof body.pageAccessToken === 'string' ? unwrap(body.pageAccessToken) : '';

  if (!kind)   return jsonError(400, 'INVALID_KIND');
  if (!pageId) return jsonError(400, 'MISSING_PAGE_ID', 'Page ID is required.');
  if (!token)  return jsonError(400, 'MISSING_TOKEN',   'Page Access Token is required.');

  // Token sanity — Meta tokens are base64-flavoured strings, usually 100+
  // chars. Reject obvious junk before paying for a Graph call.
  if (token.length < 40) {
    return jsonError(400, 'INVALID_TOKEN_FORMAT',
      'Token looks too short — copy the full Page Access Token from Meta Business Suite.');
  }
  if (!/^\d+$/.test(pageId)) {
    return jsonError(400, 'INVALID_PAGE_ID',
      'Page ID should be a numeric string (find it in Meta Business Suite → Settings → Page Details).');
  }

  // Step 1: confirm the token works at all by hitting /me.
  let me: MeResponse;
  try {
    me = await graphGet<MeResponse>('/me', { access_token: token, fields: 'id,name' });
  } catch (e) {
    return jsonError(400, 'INVALID_TOKEN',
      `Meta rejected the token. Re-generate it in Business Suite. (${e instanceof Error ? e.message : ''})`);
  }

  // Step 2: confirm the token is scoped to the page we expect. /me returns
  // the page identity when the caller is a PAGE token (which is what we
  // need). If the user pasted a USER token by mistake, /me.id != pageId.
  if (me.id !== pageId) {
    return jsonError(400, 'TOKEN_NOT_FOR_PAGE',
      'The token belongs to a different page. Generate a Page Access Token for the exact page ID you entered.');
  }

  // Step 3: for Instagram, surface the connected IG business account.
  let igBusinessId: string | undefined;
  let pageName = me.name;
  if (kind === 'instagram') {
    try {
      const page = await graphGet<PageWithIg>(`/${pageId}`, {
        access_token: token,
        fields:       'id,name,instagram_business_account',
      });
      igBusinessId = page.instagram_business_account?.id;
      pageName     = page.name ?? pageName;
      if (!igBusinessId) {
        return jsonError(400, 'NO_IG_ACCOUNT',
          'This page has no connected Instagram business account. Convert your IG account to Business in the IG app, then link it to this page.');
      }
    } catch (e) {
      return jsonError(502, 'META_API_ERROR',
        `Couldn't read page details: ${e instanceof Error ? e.message : ''}`);
    }
  }

  // Step 4: persist. Token stays in DB as JSONB — same place OAuth-issued
  // tokens would land. The dashboard can disconnect to wipe it.
  const creds: MetaChannelCreds = {
    pageId,
    pageAccessToken:  token,
    pageName:         pageName ?? undefined,
    igBusinessId,
    tokenRefreshedAt: new Date().toISOString(),
  };
  await upsertChannel(bot.id, kind, creds as unknown as Record<string, unknown>);

  return {
    ok:           true,
    pageId,
    pageName:     pageName ?? null,
    igBusinessId: igBusinessId ?? null,
  };
});
