// PATCH  /api/settings/team/[id]  — change role { role: 'admin' | 'member' }
// DELETE /api/settings/team/[id]  — revoke/remove member (or cancel invite)
//
// Both endpoints scope by the caller's user.id; owners can't be touched
// (the queries layer enforces this). Returns 404 NOT_FOUND for cross-
// tenant attempts so URL probing reveals nothing.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { deleteTeamMember, updateTeamRole } from '@/db/queries/team';

export const runtime = 'nodejs';

export const PATCH = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');

  let body: { role?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const role = body.role === 'admin' || body.role === 'member' ? body.role : null;
  if (!role) return jsonError(400, 'INVALID_ROLE', 'role must be admin or member');

  const row = await updateTeamRole(user.id, params.id, role);
  if (!row) return jsonError(404, 'NOT_FOUND');

  return {
    ok: true,
    member: {
      id: row.id, email: row.email, role: row.role, status: row.status,
      invitedAt: row.invitedAt.toISOString(),
    },
  };
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  const ok = await deleteTeamMember(user.id, params.id);
  if (!ok) return jsonError(404, 'NOT_FOUND');
  return { ok: true };
});
