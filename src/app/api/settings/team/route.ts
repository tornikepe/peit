// GET /api/settings/team → list members + the owner row synthesised on
// the fly (the owner isn't in team_members; they're the account itself).

import { withAuth } from '@/app/api/_helpers';
import { listTeam } from '@/db/queries/team';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => {
  const members = await listTeam(user.id);

  return {
    // Owner appears first, can't be deleted or have role changed.
    owner: {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      imageUrl:  user.imageUrl,
      role:      'owner' as const,
      status:    'active' as const,
    },
    members: members.map(m => ({
      id:         m.id,
      email:      m.email,
      role:       m.role,
      status:     m.status,
      invitedAt:  m.invitedAt.toISOString(),
      acceptedAt: m.acceptedAt?.toISOString() ?? null,
    })),
  };
});
