// Postgres-backed sliding-window rate limiter.
// One round-trip per check — atomic INSERT/UPDATE with conflict resolution.

import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export interface RateLimitResult {
  allowed:   boolean;
  count:     number;
  max:       number;
  resetInMs: number;
}

/**
 * Increment the counter for `key` and check against `max`.
 * If the existing row's window is older than `windowSeconds`, the counter
 * is reset to 1 and the window is re-anchored to NOW.
 *
 * Failures (DB unreachable) fall open (allowed=true) so a transient blip
 * doesn't block legitimate traffic.
 */
export async function checkRateLimit(
  key:           string,
  max:           number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (max <= 0) {
    return { allowed: false, count: 0, max, resetInMs: windowSeconds * 1000 };
  }

  const db = getDb();
  if (!db) {
    return { allowed: true, count: 0, max, resetInMs: 0 };
  }

  try {
    // Bare column references inside ON CONFLICT — they implicitly refer to the
    // existing row. The Drizzle column proxy generates qualified names that
    // PostgreSQL would reject in this position, so we use raw SQL instead.
    const result = await db.execute<{
      count:        number;
      window_start: Date | string;
    }>(sql`
      INSERT INTO rate_limits ("key", count, window_start, window_seconds)
      VALUES (${key}, 1, NOW(), ${windowSeconds})
      ON CONFLICT ("key") DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < NOW() - (${windowSeconds}::int * INTERVAL '1 second')
            THEN 1
            ELSE rate_limits.count + 1
          END,
        window_start = CASE
          WHEN rate_limits.window_start < NOW() - (${windowSeconds}::int * INTERVAL '1 second')
            THEN NOW()
            ELSE rate_limits.window_start
          END,
        window_seconds = ${windowSeconds}
      RETURNING count, window_start
    `);

    // Different drivers return rows in different shapes — normalize.
    const rows = (result as unknown as { count: number; window_start: Date | string }[])
      .length !== undefined
        ? (result as unknown as { count: number; window_start: Date | string }[])
        : ((result as unknown as { rows: { count: number; window_start: Date | string }[] }).rows ?? []);
    const row = rows[0];
    if (!row) {
      return { allowed: true, count: 0, max, resetInMs: 0 };
    }

    const count = Number(row.count);
    const startMs = new Date(row.window_start).getTime();
    const resetInMs = Math.max(0, startMs + windowSeconds * 1000 - Date.now());

    return {
      allowed: count <= max,
      count,
      max,
      resetInMs,
    };
  } catch (e) {
    console.error('[rate-limit] check failed, failing open:', e);
    return { allowed: true, count: 0, max, resetInMs: 0 };
  }
}

/** Build a stable rate-limit key. */
export function rateLimitKey(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(':').slice(0, 200);
}

/** Extract the best-available client IP from request headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/** Standard rate-limit response headers (RFC-style) for a given result. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const resetUnix = Math.ceil((Date.now() + r.resetInMs) / 1000);
  return {
    'X-RateLimit-Limit':     String(r.max),
    'X-RateLimit-Remaining': String(Math.max(0, r.max - r.count)),
    'X-RateLimit-Reset':     String(resetUnix),
  };
}

/**
 * Build a 429 Too Many Requests response with Retry-After + X-RateLimit-*
 * headers from a (failed) rate-limit result. Use when `result.allowed` is
 * false:
 *
 *   const rl = await checkRateLimit(key, 30, 60);
 *   if (!rl.allowed) return tooManyRequests(rl);
 */
export function tooManyRequests(r: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil(r.resetInMs / 1000));
  return new Response(
    JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        ...rateLimitHeaders(r),
      },
    },
  );
}
