// GET /api/admin/migrate?secret=<CRON_SECRET>
//
// One-shot remote runner for the drizzle/*.sql migrations. Built so the
// project owner can bring a fresh production database up to date by
// hitting a single URL — no terminal access required.
//
// The endpoint is idempotent: Drizzle records every applied migration in
// `drizzle.__drizzle_migrations`, so re-hitting it after everything's
// already current returns `applied: 0` and changes nothing.
//
// Auth: shares the CRON_SECRET env var that the trial-reminder cron
// already uses, so no extra secret needs to be configured. Without
// CRON_SECRET in production, the endpoint refuses to run.

import { NextResponse } from 'next/server';
import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle as drizzleClient } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production'; // open in dev
  const url    = new URL(req.url);
  const header = req.headers.get('authorization');
  if (header === `Bearer ${secret}`) return true;
  if (url.searchParams.get('secret') === secret) return true;
  return false;
}

async function handle(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { error: 'DB_NOT_CONFIGURED', message: 'DATABASE_URL is not set in env' },
      { status: 503 },
    );
  }

  // Resolve the migrations folder. On Vercel the deployed bundle includes
  // ./drizzle/ at the project root because we list its .sql files among
  // the build artifacts via the .vercelignore / default include rules.
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

  // Use a dedicated short-lived connection — separate from the runtime
  // pool — so a migration error never poisons the long-lived db client.
  const client = postgres(databaseUrl, { max: 1, prepare: false });
  const db     = drizzleClient(client);

  const started = Date.now();
  try {
    await migrate(db, { migrationsFolder });
    return NextResponse.json({
      ok:        true,
      message:   'Migrations applied (or already up to date).',
      latencyMs: Date.now() - started,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[admin/migrate] failed:', e);
    return NextResponse.json({
      ok:    false,
      error: 'MIGRATION_FAILED',
      // Pass the underlying SQL error back so the operator can act on it.
      message: msg,
      latencyMs: Date.now() - started,
    }, { status: 500 });
  } finally {
    await client.end({ timeout: 5 }).catch(() => undefined);
  }
}

export async function GET(req: Request)  { return handle(req); }
export async function POST(req: Request) { return handle(req); }
