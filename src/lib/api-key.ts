// API key utilities. Tiny by design — the storage convention is the
// same across services like Stripe / OpenAI / GitHub:
//
//   raw key  →  shown to the customer ONCE at creation
//   prefix   →  first 12 chars, indexable + safe to display
//   hash     →  SHA-256 of the raw key, the only thing stored at rest
//
// 192 bits of entropy in the key body means a salted bcrypt buys nothing
// meaningful — the key is already unguessable. SHA-256 is fast (cheap to
// verify on every request) and Postgres can index the hex digest directly.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Build a new API key tuple: raw (shown once), prefix (indexed), hash (stored). */
export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  // 24 bytes → 48 hex chars → 192 bits of entropy. Stripe uses ~36 chars
  // after their prefix; we sit comfortably above their bar.
  const body = randomBytes(24).toString('hex');
  const raw  = `pk_live_${body}`;
  // Prefix is 12 chars — enough to disambiguate in UI without revealing
  // the rest. Stripe shows ~12 chars on their dashboard for the same reason.
  const prefix = raw.slice(0, 12);
  const hash   = createHash('sha256').update(raw).digest('hex');
  return { raw, prefix, hash };
}

/** Verify a raw key against a stored hash. */
export function verifyApiKey(raw: string, expectedHash: string): boolean {
  const candidate = createHash('sha256').update(raw).digest('hex');
  try {
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}
