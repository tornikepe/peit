// Lazy provisioning: call this at the top of every authenticated API route.
// Looks up (or creates) the DB user row keyed by Clerk's userId.

import { eq } from 'drizzle-orm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { requireDb, schema } from '@/db';

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

  const [created] = await db.insert(schema.users)
    .values({
      clerkId:  userId,
      email,
      name,
      imageUrl: clerk?.imageUrl ?? null,
    })
    .returning();

  return created;
}
