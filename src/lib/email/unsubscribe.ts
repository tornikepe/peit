// HMAC-signed unsubscribe URLs.
//
// Stateless: the URL itself proves who the recipient is and which category
// they're opting out of. No DB lookup at click time — the GET handler
// verifies the HMAC and then writes the preference.
//
// Token shape: `<userId>.<type>.<sig>`
//   userId  — UUID, identifies the user row
//   type    — preference key (e.g. "productUpdates") OR "all" for global opt-out
//   sig     — HMAC-SHA256(secret, "<userId>:<type>"), base64url, first 32 chars
//
// No expiration on the token: unsubscribe links should keep working forever
// — if a user finds a year-old email they want to opt out of, they should
// be able to.

import crypto from 'node:crypto';
import type { EmailPrefs } from '@/db/schema';
import { appBaseUrl } from './send';

export type UnsubCategory = keyof EmailPrefs | 'all';

const VALID_CATEGORIES: ReadonlySet<UnsubCategory> = new Set<UnsubCategory>([
  'leadAlerts', 'productUpdates', 'trialReminders', 'all',
]);

/**
 * Derive the HMAC key. Prefers a dedicated env var; falls back to a hash of
 * existing secrets so the system works out-of-the-box. NOTE: rotating
 * CLERK_SECRET_KEY would invalidate all outstanding unsubscribe links — set
 * UNSUBSCRIBE_SECRET explicitly in production to decouple them.
 */
function getSecret(): string {
  const explicit = process.env.UNSUBSCRIBE_SECRET;
  if (explicit && explicit.length >= 16) return explicit;

  const seed = process.env.CLERK_SECRET_KEY
            ?? process.env.LEMONSQUEEZY_WEBHOOK_SECRET
            ?? process.env.DATABASE_URL
            ?? 'peit-dev-fallback-secret-do-not-use-in-production';
  return crypto.createHash('sha256').update(`peit:unsub:${seed}`).digest('hex');
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url')
    .slice(0, 32);
}

export interface UnsubToken {
  userId: string;
  type:   UnsubCategory;
}

/** Generate the absolute unsubscribe URL for the given user + category. */
export function unsubscribeUrl(userId: string, type: UnsubCategory): string {
  const payload = `${userId}:${type}`;
  const sig     = sign(payload);
  const params  = new URLSearchParams({ u: userId, t: type, s: sig });
  return `${appBaseUrl()}/api/unsubscribe?${params.toString()}`;
}

/**
 * Verify a token from inbound request params. Returns the validated
 * { userId, type } or null on any tampering / unknown category.
 */
export function verifyUnsubToken(params: {
  u?: string | null;
  t?: string | null;
  s?: string | null;
}): UnsubToken | null {
  const userId = params.u?.trim();
  const type   = params.t?.trim() as UnsubCategory | undefined;
  const sig    = params.s?.trim();
  if (!userId || !type || !sig) return null;
  if (!VALID_CATEGORIES.has(type)) return null;
  // UUID v4 sanity check — defends against malformed input reaching the DB.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return null;
  }

  const expected = sign(`${userId}:${type}`);
  // Constant-time compare. Buffers must be same length — sign() always
  // returns 32 chars, so the truncated input must too.
  if (sig.length !== expected.length) return null;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { userId, type };
}
