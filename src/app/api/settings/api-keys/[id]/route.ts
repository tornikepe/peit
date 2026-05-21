// DELETE /api/settings/api-keys/[id] — soft-revoke (sets revoked_at).
// We keep the row so a future audit log can still resolve "which key
// was used at request X".

import { withAuth, jsonError } from '@/app/api/_helpers';
import { revokeApiKey } from '@/db/queries/api-keys';

export const runtime = 'nodejs';

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  const ok = await revokeApiKey(user.id, params.id);
  if (!ok) return jsonError(404, 'NOT_FOUND');
  return { ok: true };
});
