// Team membership queries. Scoped to the owning user — every read/write
// goes through `userId` so a logged-in customer can only see / mutate
// their own workspace's invites.

import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { requireDb, schema } from '@/db';
import type { DbTeam } from '@/db/schema';

export type TeamRole   = 'owner' | 'admin' | 'member';
export type TeamStatus = 'pending' | 'active' | 'revoked';

export async function listTeam(userId: string): Promise<DbTeam[]> {
  const db = requireDb();
  return db.query.teamMembers.findMany({
    where: eq(schema.teamMembers.userId, userId),
  });
}

export async function inviteTeamMember(
  userId: string,
  email:  string,
  role:   Exclude<TeamRole, 'owner'>,
): Promise<{ row: DbTeam; token: string }> {
  const db = requireDb();
  // 32-char random token, urlsafe. Stored on the row so the accept link
  // can be `/accept?token=…` without leaking the row UUID.
  const token = crypto.randomBytes(24).toString('base64url');

  // Upsert so re-inviting the same email refreshes the token + invite_at
  // instead of duplicating rows. The unique (user_id, email) index
  // makes ON CONFLICT cheap.
  const [row] = await db
    .insert(schema.teamMembers)
    .values({
      userId,
      email: email.toLowerCase(),
      role,
      status: 'pending',
      inviteToken: token,
    })
    .onConflictDoUpdate({
      target: [schema.teamMembers.userId, schema.teamMembers.email],
      set: {
        role,
        status: 'pending',
        inviteToken: token,
        invitedAt: new Date(),
        acceptedAt: null,
      },
    })
    .returning();

  return { row, token };
}

export async function deleteTeamMember(userId: string, id: string): Promise<boolean> {
  const db = requireDb();
  // Two-step so we never delete the owner row (if it ever lands here)
  // and so attempts to delete someone else's invite return false.
  const existing = await db.query.teamMembers.findFirst({
    where: and(
      eq(schema.teamMembers.id, id),
      eq(schema.teamMembers.userId, userId),
    ),
  });
  if (!existing) return false;
  if (existing.role === 'owner') return false; // owner can't be removed
  await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id));
  return true;
}

export async function updateTeamRole(
  userId: string,
  id:     string,
  role:   Exclude<TeamRole, 'owner'>,
): Promise<DbTeam | null> {
  const db = requireDb();
  const existing = await db.query.teamMembers.findFirst({
    where: and(
      eq(schema.teamMembers.id, id),
      eq(schema.teamMembers.userId, userId),
    ),
  });
  if (!existing) return null;
  if (existing.role === 'owner') return null; // owner role can't change
  const [row] = await db
    .update(schema.teamMembers)
    .set({ role })
    .where(eq(schema.teamMembers.id, id))
    .returning();
  return row;
}
