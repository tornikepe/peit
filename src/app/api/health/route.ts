// GET /api/health — liveness + readiness probe.
//
// Used by uptime monitors (UptimeRobot, Better Stack, Vercel cron) and
// external load balancers. Returns 200 when the runtime is alive AND
// every required dependency answers within 1 second. Returns 503 when
// any required dependency is offline.
//
// Optional dependencies (Anthropic, Voyage, Resend, Lemon Squeezy) are
// reported but never fail the check — they have graceful fallbacks in
// the app. Only the database is treated as required because absolutely
// every paying-customer feature depends on it.
//
// Response shape (stable, safe to monitor against):
//   {
//     ok:      boolean,
//     status:  "healthy" | "degraded" | "down",
//     version: string,
//     uptimeMs: number,
//     timestamp: string,
//     checks: {
//       db:        { ok: boolean, latencyMs?: number, error?: string },
//       anthropic: { configured: boolean },
//       voyage:    { configured: boolean },
//       resend:    { configured: boolean },
//       lemon:     { configured: boolean },
//     }
//   }

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Don't let health probes get held up by a misbehaving downstream.
export const maxDuration = 5;

const START_AT = Date.now();
const VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
             ?? process.env.npm_package_version
             ?? 'dev';

interface CheckResult { ok: boolean; latencyMs?: number; error?: string }

/** Run a SELECT 1 against the DB with a 1s timeout. */
async function checkDatabase(): Promise<CheckResult> {
  const db = getDb();
  if (!db) return { ok: false, error: 'DATABASE_URL not set' };

  const started = Date.now();
  try {
    const result = await Promise.race([
      db.execute(sql`select 1 as ok`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 1000),
      ),
    ]);
    // drizzle returns an array-like; just confirm the query executed.
    if (!result) return { ok: false, latencyMs: Date.now() - started, error: 'NO_RESPONSE' };
    return { ok: true, latencyMs: Date.now() - started };
  } catch (e) {
    return {
      ok:        false,
      latencyMs: Date.now() - started,
      error:     e instanceof Error ? e.message : 'unknown',
    };
  }
}

export async function GET() {
  const db = await checkDatabase();

  // Optional integrations — never fail the probe, just report.
  const anthropic = { configured: !!process.env.ANTHROPIC_API_KEY };
  const voyage    = { configured: !!process.env.VOYAGE_API_KEY };
  const resend    = { configured: !!process.env.RESEND_API_KEY };
  const lemon     = { configured: !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID) };

  // Overall verdict — DB is the only hard requirement.
  const status: 'healthy' | 'degraded' | 'down' =
    !db.ok                                     ? 'down'
    : (!anthropic.configured || !lemon.configured) ? 'degraded'
    : 'healthy';

  const body = {
    ok:        db.ok,
    status,
    version:   VERSION,
    uptimeMs:  Date.now() - START_AT,
    timestamp: new Date().toISOString(),
    checks: { db, anthropic, voyage, resend, lemon },
  };

  return NextResponse.json(body, {
    status: db.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      // Uptime monitors usually fetch with HEAD/GET — make caches
      // predictable for them.
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
