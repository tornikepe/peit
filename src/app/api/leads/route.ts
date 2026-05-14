// GET /api/leads
// Query params:
//   botId    — restrict to single bot
//   status   — new | contacted | qualified | won | lost
//   search   — fuzzy match across name / email / phone / message
//   limit    — default 50, max 200
//   offset   — default 0
//
// Returns:
//   {
//     ok: true,
//     leads:  DashboardLead[],
//     total:  number,
//     counts: { new, contacted, qualified, won, lost, total }
//   }

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  listLeadsForUser, countLeadsForUser, countLeadsByStatus,
  type LeadStatus, type LeadFilters,
} from '@/db/queries/leads';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set<LeadStatus>([
  'new', 'contacted', 'qualified', 'won', 'lost',
]);

export const GET = withAuth(async ({ user, req }) => {
  const url = new URL(req.url);

  const statusParam = url.searchParams.get('status');
  if (statusParam && !VALID_STATUSES.has(statusParam as LeadStatus)) {
    return jsonError(400, 'INVALID_STATUS');
  }

  const filters: LeadFilters = {
    botId:  url.searchParams.get('botId')  ?? undefined,
    status: (statusParam as LeadStatus | null) ?? undefined,
    search: url.searchParams.get('search')?.trim() || undefined,
    limit:  Number(url.searchParams.get('limit'))  || 50,
    offset: Number(url.searchParams.get('offset')) || 0,
  };

  const [leads, total, counts] = await Promise.all([
    listLeadsForUser(user.id, filters),
    countLeadsForUser(user.id, filters),
    countLeadsByStatus(user.id),
  ]);

  return {
    ok:     true,
    leads:  leads.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
    total,
    counts,
  };
});
