// POST /api/settings/team/invite
// Body: { email, role: 'admin' | 'member' }
//
// Upserts a team_members row (status='pending') for the owner's
// workspace and fires the invite email through Resend. Returns 200 +
// the persisted row even when the email send fails — the operator can
// always resend.

import { withAuth, jsonError } from '@/app/api/_helpers';
import { inviteTeamMember } from '@/db/queries/team';
import { isEmailAvailable, sendTeamInviteEmail } from '@/lib/email';

export const runtime = 'nodejs';

interface InviteBody { email?: unknown; role?: unknown }

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export const POST = withAuth(async ({ user, req }) => {
  let body: InviteBody;
  try { body = await req.json() as InviteBody; }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role  = body.role === 'admin' || body.role === 'member' ? body.role : null;
  if (!EMAIL_RE.test(email)) return jsonError(400, 'INVALID_EMAIL');
  if (!role)                return jsonError(400, 'INVALID_ROLE', 'role must be admin or member');

  // Prevent inviting yourself — needless row + confusing UX.
  if (email === user.email.toLowerCase()) {
    return jsonError(400, 'CANT_INVITE_SELF');
  }

  const { row, token } = await inviteTeamMember(user.id, email, role);

  // Fire-and-forget email — we always 200 even if Resend hiccups so the
  // operator can hit "resend" without managing partial state.
  if (isEmailAvailable()) {
    void sendTeamInviteEmail({
      to:        email,
      ownerName: user.name,
      ownerLang: user.locale,
      role,
      token,
    }).catch(e => console.error('[settings/team/invite] email failed:', e));
  }

  return {
    ok: true,
    member: {
      id:         row.id,
      email:      row.email,
      role:       row.role,
      status:     row.status,
      invitedAt:  row.invitedAt.toISOString(),
    },
  };
});
