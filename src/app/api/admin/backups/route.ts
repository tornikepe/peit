// GET /api/admin/backups — last backup-health entries. Admin-only
// (ADMIN_EMAILS allowlist).

import { desc } from 'drizzle-orm';
import { withAuth } from '@/app/api/_helpers';
import { requireAdmin } from '@/lib/admin';
import { requireDb, schema } from '@/db';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => {
  const denied = requireAdmin(user);
  if (denied) return denied;

  const db = requireDb();
  const rows = await db
    .select()
    .from(schema.backupLogs)
    .orderBy(desc(schema.backupLogs.createdAt))
    .limit(7);

  return {
    backups: rows.map(r => ({
      id:         r.id,
      status:     r.status,
      sizeBytes:  r.sizeBytes,
      durationMs: r.durationMs,
      error:      r.error,
      createdAt:  r.createdAt,
    })),
  };
});
