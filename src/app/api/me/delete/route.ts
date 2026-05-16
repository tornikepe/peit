// POST /api/me/delete — GDPR Art. 17 (right to erasure).
//
// Permanently deletes:
//   - The Clerk user (auth side — kills all sessions, future logins)
//   - The DB user row (cascade-deletes bots, faqs, knowledge chunks,
//     conversations, messages, leads, subscription — see schema FKs)
//
// Body: { confirm: 'DELETE' } — a literal text confirmation to avoid
// accidental UI mishaps. Rate-limited to 2 per hour to discourage abuse
// (which would still need a valid Clerk session).
//
// Best practice: cascade deletion is irreversible; Lemon Squeezy subscription
// is NOT auto-cancelled here — the user should cancel their subscription
// from the customer portal first, otherwise the next billing attempt will
// fail (LS handles that gracefully, but we surface a warning client-side).

import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { getDb, schema } from '@/db';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface DeleteBody {
  confirm?: string;
}

export const POST = withAuth(async ({ user, req }) => {
  const rl = await checkRateLimit(rateLimitKey(['delete', user.id]), 2, 3600);
  if (!rl.allowed) {
    return jsonError(429, 'RATE_LIMITED',
      `Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`);
  }

  // Confirmation gate — defends against CSRF and accidental clicks.
  // The client must POST { confirm: "DELETE" } literally.
  let body: DeleteBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON',
      'Body must be JSON like { "confirm": "DELETE" }.');
  }
  if (body.confirm !== 'DELETE') {
    return jsonError(400, 'CONFIRM_REQUIRED',
      'Send { "confirm": "DELETE" } to proceed.');
  }

  const db = getDb()!;

  // Step 1: delete Clerk user. If this fails, abort — we never want to leave
  // a "dangling" auth identity that could later re-provision a fresh user
  // row and bypass deletion.
  try {
    const client = await clerkClient();
    await client.users.deleteUser(user.clerkId);
  } catch (e) {
    // 404 from Clerk means the user is already gone — proceed to DB cleanup
    // anyway. Everything else is fatal.
    const status = (e as { status?: number }).status;
    if (status !== 404) {
      console.error('[me/delete] clerk deletion failed:', e);
      return jsonError(502, 'CLERK_DELETE_FAILED',
        'Auth provider rejected the request. Try again or contact support.');
    }
  }

  // Step 2: delete the DB user row. Drizzle schema declares ON DELETE CASCADE
  // for all owned rows (bots → faqs/chunks/conversations/leads, subscription),
  // so this single delete removes everything we hold.
  try {
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
  } catch (e) {
    console.error('[me/delete] db deletion failed:', e);
    // Clerk is already deleted at this point — user can't log back in,
    // but we have orphaned rows. Surface to support rather than retrying.
    return jsonError(500, 'PARTIAL_DELETE',
      'Account access removed, but stored data cleanup failed. Email legal@peit.ge to complete deletion.');
  }

  return {
    ok:      true,
    deleted: true,
    message: 'Your account and all associated data have been permanently deleted.',
  };
});
