// PATCH /api/leads/[id]
// Body: { status: LeadStatus }
// Returns: { ok: true } or 404 if the lead doesn't belong to the user.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { updateLeadStatus, type LeadStatus } from '@/db/queries/leads';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set<LeadStatus>([
  'new', 'contacted', 'qualified', 'won', 'lost',
]);

export const PATCH = withAuth<{ id: string }>(async ({ user, req, params }) => {
  let body: { status?: string };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const status = body.status as LeadStatus | undefined;
  if (!status || !VALID_STATUSES.has(status)) {
    return jsonError(400, 'INVALID_STATUS');
  }

  const ok = await updateLeadStatus(user.id, params.id, status);
  if (!ok) return jsonError(404, 'NOT_FOUND');

  return { ok: true };
});
