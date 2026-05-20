// Meta (Facebook / Instagram) Graph API client — thin wrapper, no SDK.
//
// Scope of this file: send a message from one of our connected pages, and
// validate a long-lived page access token. The OAuth dance that PRODUCES
// the token lives in /api/channels/[botId]/instagram/auth and
// /api/channels/[botId]/facebook/auth — they share the same pattern.
//
// Requirements for any of this to actually fire in production:
//   1. A Meta App registered at https://developers.facebook.com — App ID +
//      App Secret go into META_APP_ID / META_APP_SECRET env vars.
//   2. App Review approval for pages_messaging (Facebook) and
//      instagram_basic + instagram_manage_messages (Instagram). Without
//      review, only the app's developer + testers can complete the flow.
//   3. Business verification — Meta blocks production tokens otherwise.
//   4. Webhook subscription configured at App Dashboard → Webhooks with
//      callback URL https://<domain>/api/channels/meta/webhook and the
//      META_WEBHOOK_VERIFY_TOKEN below.
//
// We ship this with the env vars optional so the rest of the app keeps
// building when Meta isn't set up. isMetaAvailable() gates UI affordances.

const GRAPH_BASE = 'https://graph.facebook.com/v22.0';

export class MetaApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Meta API ${status}: ${body}`);
    this.name = 'MetaApiError';
  }
}

export function isMetaAvailable(): boolean {
  return !!(
    process.env.META_APP_ID?.trim() &&
    process.env.META_APP_SECRET?.trim()
  );
}

export function requireMeta(): { appId: string; appSecret: string } {
  const appId     = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) throw new Error('META_NOT_CONFIGURED');
  return { appId, appSecret };
}

/** Token used by Meta's GET /webhook verification handshake. */
export function getWebhookVerifyToken(): string | null {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || null;
}

async function metaFetch<T>(path: string, opts: {
  method?: 'GET' | 'POST' | 'DELETE';
  body?:   unknown;
  query?:  Record<string, string | undefined>;
} = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v != null) qs.set(k, v);
  }
  const url = `${GRAPH_BASE}${path}${qs.toString() ? '?' + qs.toString() : ''}`;

  const res = await fetch(url, {
    method:  opts.method ?? 'GET',
    headers: opts.body ? { 'content-type': 'application/json' } : undefined,
    body:    opts.body ? JSON.stringify(opts.body) : undefined,
    signal:  AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new MetaApiError(res.status, text.slice(0, 400));
  }
  return res.json() as Promise<T>;
}

// ─── Page / Account info ───────────────────────────────────────────────────

interface PageInfo {
  id:    string;
  name:  string;
  // Instagram Business Account is only present on IG-connected pages.
  instagram_business_account?: { id: string };
}

/** Verify a page-access-token works and return the page's metadata. */
export async function getPageInfo(pageId: string, pageAccessToken: string): Promise<PageInfo> {
  return metaFetch<PageInfo>(`/${pageId}`, {
    query: {
      fields:       'id,name,instagram_business_account',
      access_token: pageAccessToken,
    },
  });
}

// ─── Sending messages ──────────────────────────────────────────────────────

/**
 * Send a text message via Facebook Messenger. `recipientId` is the page-
 * scoped user ID (PSID) from the inbound webhook event.
 */
export async function sendMessengerMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
): Promise<void> {
  await metaFetch<{ message_id: string }>('/me/messages', {
    method: 'POST',
    query:  { access_token: pageAccessToken },
    body: {
      recipient:        { id: recipientId },
      message:          { text: text.slice(0, 2000) },
      messaging_type:   'RESPONSE',
    },
  });
}

/**
 * Send a text message via Instagram Direct. Same API surface as Messenger
 * (the IG Messaging API mirrors Messenger Platform) — Meta sniffs the
 * recipient ID space to route appropriately.
 */
export async function sendInstagramMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
): Promise<void> {
  await sendMessengerMessage(pageAccessToken, recipientId, text);
}

// ─── OAuth helpers ─────────────────────────────────────────────────────────

/** Generate the Meta-hosted authorization URL for the install flow. */
export function buildAuthUrl(opts: {
  redirectUri: string;
  state:       string;
  scope:       'facebook' | 'instagram';
}): string {
  const { appId } = requireMeta();
  const scopes = opts.scope === 'instagram'
    ? 'pages_show_list,pages_messaging,instagram_basic,instagram_manage_messages,business_management'
    : 'pages_show_list,pages_messaging,pages_read_engagement,business_management';
  const qs = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  opts.redirectUri,
    state:         opts.state,
    scope:         scopes,
    response_type: 'code',
  });
  return `https://www.facebook.com/v22.0/dialog/oauth?${qs.toString()}`;
}

interface TokenExchange { access_token: string; token_type: string; expires_in?: number }

/** Step 2 of the OAuth flow: convert an auth code into a short-lived token. */
export async function exchangeAuthCode(code: string, redirectUri: string): Promise<TokenExchange> {
  const { appId, appSecret } = requireMeta();
  return metaFetch<TokenExchange>('/oauth/access_token', {
    query: {
      client_id:     appId,
      client_secret: appSecret,
      redirect_uri:  redirectUri,
      code,
    },
  });
}

/** Upgrade short-lived → long-lived (≈60-day) user token. */
export async function extendUserToken(shortToken: string): Promise<TokenExchange> {
  const { appId, appSecret } = requireMeta();
  return metaFetch<TokenExchange>('/oauth/access_token', {
    query: {
      grant_type:     'fb_exchange_token',
      client_id:      appId,
      client_secret:  appSecret,
      fb_exchange_token: shortToken,
    },
  });
}

interface UserPagesResponse {
  data: Array<{
    id:           string;
    name:         string;
    access_token: string;
    instagram_business_account?: { id: string };
  }>;
}

/** List the pages the user manages — pick one to attach to a bot. */
export async function listUserPages(userAccessToken: string): Promise<UserPagesResponse['data']> {
  const res = await metaFetch<UserPagesResponse>('/me/accounts', {
    query: {
      fields:       'id,name,access_token,instagram_business_account',
      access_token: userAccessToken,
    },
  });
  return res.data;
}
