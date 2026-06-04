// GET /api/cron/backup — daily backup-health check (Vercel Cron, 02:00).
//
// Neon performs the actual database backups + point-in-time recovery; there's
// no pg_dump binary in the serverless runtime and dumping a managed DB from a
// function is impractical. This job instead verifies the DB is reachable,
// records its size, and writes a `backup_logs` audit row that the admin panel
// surfaces — giving an at-a-glance "backups are healthy" signal + alert hook.
//
// Auth: shared CRON_SECRET via `Authorization: Bearer <secret>` or `?secret=`.

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production'; // open in dev
  const url = new URL(req.url);
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (url.searchParams.get('secret') === secret) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const db = getDb();
  if (!db) {
    logger.error('backup cron: DB not configured', { route: '/api/cron/backup' });
    return NextResponse.json({ ok: false, error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  }

  const started = Date.now();
  let sizeBytes: number | null = null;
  let status: 'success' | 'failed' = 'success';
  let error: string | null = null;

  try {
    // Reachability + size. pg_database_size returns the on-disk size in bytes.
    const rows = await db.execute<{ size: string }>(
      sql`select pg_database_size(current_database()) as size`,
    );
    // drizzle execute returns rows in different shapes per driver — read defensively.
    const raw = (Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] }).rows?.[0]) as
      | { size?: string | number } | undefined;
    sizeBytes = raw?.size != null ? Number(raw.size) : null;
  } catch (e) {
    status = 'failed';
    error  = e instanceof Error ? e.message : 'unknown';
  }

  const durationMs = Date.now() - started;

  // Record the audit row (best-effort — never let logging the check fail the check).
  try {
    await db.insert(schema.backupLogs).values({
      status,
      sizeBytes,
      durationMs,
      storagePath: 'neon-managed/pitr',
      error,
    });
  } catch (e) {
    logger.error('backup cron: failed to write backup_logs', {
      route: '/api/cron/backup',
      error: e instanceof Error ? e.message : 'unknown',
    });
  }

  logger.info('backup cron ran', { route: '/api/cron/backup', status, durationMs, sizeBytes });

  return NextResponse.json(
    { ok: status === 'success', status, sizeBytes, durationMs, timestamp: new Date().toISOString() },
    { status: status === 'success' ? 200 : 500 },
  );
}
