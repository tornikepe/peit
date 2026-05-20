// GET /api/channels/meta/info
// Returns the public Meta connection metadata an end-user needs to paste
// into their own Meta App Dashboard so inbound messages reach Peit:
//   - webhookUrl    — the callback URL to register
//   - verifyToken   — the shared handshake secret (META_WEBHOOK_VERIFY_TOKEN)
//   - oauthAvailable — true when Peit owns a Meta App and the OAuth path
//                     will work; false → paste-token only.
//
// The verify token is NOT a secret in the security sense (it appears in
// Meta's GET handshake URL in the clear), so exposing it to authenticated
// dashboard users is fine.

import { withAuth } from '@/app/api/_helpers';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ req }) => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  const origin = envUrl ?? new URL(req.url).origin;

  return {
    webhookUrl:      `${origin}/api/channels/meta/webhook`,
    verifyToken:     process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() ?? null,
    oauthAvailable:  !!(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim()),
  };
});
