// Lemon Squeezy client — thin fetch wrapper, server-side only.
// We don't pull in the official SDK because the surface we need is tiny and
// the SDK's JSON:API types are heavy. All calls go through `lsFetch`.
//
// Required env:
//   LEMONSQUEEZY_API_KEY      — Settings → API → "Create new" (test or live)
//   LEMONSQUEEZY_STORE_ID     — Stores → click your store → URL contains the ID
//   LEMONSQUEEZY_WEBHOOK_SECRET — set when creating the webhook in dashboard
//
// Optional:
//   NEXT_PUBLIC_APP_URL — used to build success/redirect URLs.

const API_BASE = 'https://api.lemonsqueezy.com/v1';

export function isLemonAvailable(): boolean {
  return !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}

export function getStoreId(): string | null {
  return process.env.LEMONSQUEEZY_STORE_ID ?? null;
}

export function requireLemon(): { apiKey: string; storeId: string } {
  const apiKey  = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) throw new Error('LEMON_NOT_CONFIGURED');
  return { apiKey, storeId };
}

/**
 * App's public URL — used for redirect_url and receipt_link_url.
 * Must be a fully-qualified origin.
 */
export function getAppUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (req) {
    try { return new URL(req.url).origin; } catch { /* fall through */ }
  }
  return 'http://localhost:3000';
}

interface LsFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?:   unknown;
}

/** Authenticated fetch against the Lemon Squeezy API (JSON:API). */
export async function lsFetch<T = unknown>(
  path: string,
  opts: LsFetchOptions = {},
): Promise<T> {
  const { apiKey } = requireLemon();
  const res = await fetch(`${API_BASE}${path}`, {
    method:  opts.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept:        'application/vnd.api+json',
      'Content-Type':'application/vnd.api+json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new LsApiError(res.status, text || res.statusText);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class LsApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`LS API ${status}: ${body}`);
    this.name = 'LsApiError';
  }
}

// ─── Typed shapes we actually use ─────────────────────────────────────────
// Lemon Squeezy returns JSON:API. We only type the fields we care about.

export interface LsSubscriptionAttrs {
  store_id:       number;
  customer_id:    number;
  order_id:       number;
  product_id:     number;
  variant_id:     number;
  user_email:     string;
  status:         'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
  status_formatted: string;
  cancelled:      boolean;
  trial_ends_at:  string | null;
  renews_at:      string | null;
  ends_at:        string | null;
  created_at:     string;
  updated_at:     string;
  urls: {
    update_payment_method: string;
    customer_portal:       string;
    customer_portal_update_subscription?: string;
  };
}

export interface LsResource<A> {
  type:       string;
  id:         string;
  attributes: A;
}

export interface LsDoc<A> {
  data: LsResource<A>;
}

export interface LsCheckoutAttrs {
  url: string;
}

export interface LsCustomerAttrs {
  store_id: number;
  name:     string;
  email:    string;
  urls: { customer_portal: string };
}

/**
 * The `subscription_payment_*` webhooks deliver a `subscription-invoice`
 * resource rather than the subscription itself. We only care about its
 * `subscription_id` and `customer_id` for routing.
 */
export interface LsSubscriptionInvoiceAttrs {
  store_id:       number;
  subscription_id: number;
  customer_id:    number;
  user_email:     string;
  billing_reason: 'initial' | 'renewal' | 'updated';
  status:         'paid' | 'pending' | 'failed' | 'void' | 'refunded';
}
