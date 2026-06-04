// Platform admin gating.
//
// There is no super-admin role in the data model; instead a small allowlist of
// admin emails is configured via the ADMIN_EMAILS env var (comma-separated).
// Used by ops/admin surfaces (backup log, promo codes, affiliate review, …).
//
//   ADMIN_EMAILS=peit@example.com, ops@example.com

import { jsonError } from '@/app/api/_helpers';
import type { DbUser } from '@/db/schema';

function adminSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** True if the email is in the ADMIN_EMAILS allowlist. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminSet().has(email.trim().toLowerCase());
}

/** True if the provisioned DB user is an admin. */
export function isAdminUser(user: Pick<DbUser, 'email'>): boolean {
  return isAdminEmail(user.email);
}

/**
 * Guard for admin API routes. Returns a 403 Response when the user isn't an
 * admin, or null when access is granted:
 *
 *   const denied = requireAdmin(user);
 *   if (denied) return denied;
 */
export function requireAdmin(user: Pick<DbUser, 'email'>): Response | null {
  return isAdminUser(user) ? null : jsonError(403, 'FORBIDDEN', 'Admin access required.');
}
