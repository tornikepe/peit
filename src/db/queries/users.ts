// Lazy provisioning: call this at the top of every authenticated API route.
// Looks up (or creates) the DB user row keyed by Clerk's userId.

import { eq } from 'drizzle-orm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { requireDb, schema } from '@/db';
import { sendWelcomeEmail, isEmailAvailable } from '@/lib/email';
import { normalizeLang } from '@/lib/email/i18n';

/**
 * Fire a welcome email after first provisioning. Best-effort — runs in the
 * background so the auth path stays fast. Errors are logged and swallowed:
 * a missed welcome email is never worth failing a login over.
 */
function dispatchWelcomeEmail(row: typeof schema.users.$inferSelect): void {
  if (!isEmailAvailable()) return;
  void sendWelcomeEmail({
    to: {
      userId:     row.id,
      email:      row.email,
      name:       row.name,
      locale:     row.locale,
      emailPrefs: row.emailPrefs,
    },
  }).catch(e => console.error('[users] welcome email failed:', e));
}

export async function getCurrentUserOrThrow() {
  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHORIZED');

  const db = requireDb();

  // Fast path: existing user
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.clerkId, userId),
  });
  if (existing) return existing;

  // First touch — fetch full Clerk profile
  const clerk = await currentUser();
  const email = clerk?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.local`;
  const name  = [clerk?.firstName, clerk?.lastName].filter(Boolean).join(' ') || null;
  // Try to pick locale from Clerk; fall back to Georgian.
  const rawLocale = (clerk?.publicMetadata?.locale as string | undefined) ?? 'ka';
  const locale    = normalizeLang(rawLocale);

  const [created] = await db.insert(schema.users)
    .values({
      clerkId:  userId,
      email,
      name,
      imageUrl: clerk?.imageUrl ?? null,
      locale,
    })
    .returning();

  // Fire-and-forget — never block auth on email delivery.
  dispatchWelcomeEmail(created);

  return created;
}
