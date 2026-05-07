// GET /api/me — provisions the user (if first hit) and returns profile.
// Used by the client to detect whether the DB-backed mode is available.

import { withAuth } from '@/app/api/_helpers';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => ({
  ok: true,
  user: {
    id:       user.id,
    email:    user.email,
    name:     user.name,
    imageUrl: user.imageUrl,
  },
}));
