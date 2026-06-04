// Referral helpers — code generation + attribution.

import { eq, and, sql } from 'drizzle-orm';
import { requireDb, schema } from '@/db';

/** Cookie that carries a ?ref code from the signup link until provisioning. */
export const REFERRAL_COOKIE = 'peit_ref';
/** Discount the referred user gets on their first month. */
export const REFERRED_DISCOUNT_PERCENT = 10;
/** Free months the referrer earns per successful referral. */
export const REFERRER_FREE_MONTHS = 1;

const RANDOM = () => Math.random().toString(36).slice(2, 6);

/** Build a slug base from a name/email — ASCII only, lowercased. */
function slugBase(seed: string | null | undefined): string {
  const ascii = (seed ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return ascii.slice(0, 12) || 'peit';
}

/**
 * Generate a referral code that's unique in `users.referral_code`.
 * Format: `<base>-<rand4>` e.g. "tornike-x7k2". Retries on the rare collision.
 */
export async function generateUniqueReferralCode(seed: string | null | undefined): Promise<string> {
  const db = requireDb();
  const base = slugBase(seed);
  for (let i = 0; i < 6; i++) {
    const code = `${base}-${RANDOM()}`;
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.referralCode, code),
      columns: { id: true },
    });
    if (!existing) return code;
  }
  // Extremely unlikely fallback: timestamp suffix.
  return `${base}-${Date.now().toString(36)}`;
}

/** Ensure a user has a referral code; returns it (generating + persisting if missing). */
export async function ensureReferralCode(user: typeof schema.users.$inferSelect): Promise<string> {
  if (user.referralCode) return user.referralCode;
  const db = requireDb();
  const code = await generateUniqueReferralCode(user.name ?? user.email);
  await db.update(schema.users)
    .set({ referralCode: code, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  return code;
}

/** Resolve a referral code → referrer user id (or null). Never matches self. */
export async function resolveReferrer(code: string, selfUserId: string): Promise<string | null> {
  const trimmed = code.trim().toLowerCase();
  if (!trimmed) return null;
  const db = requireDb();
  const ref = await db.query.users.findFirst({
    where: eq(schema.users.referralCode, trimmed),
    columns: { id: true },
  });
  if (!ref || ref.id === selfUserId) return null;
  return ref.id;
}

/**
 * Reward a referrer when their referred user pays for the first time.
 * Idempotent: only flips a 'pending' row to 'rewarded' once.
 * Returns true if a reward was just granted.
 */
export async function rewardReferralOnPayment(referredUserId: string): Promise<boolean> {
  const db = requireDb();
  const row = await db.query.referrals.findFirst({
    where: and(
      eq(schema.referrals.referredId, referredUserId),
      eq(schema.referrals.status, 'pending'),
    ),
  });
  if (!row) return false;

  await db.update(schema.referrals)
    .set({ status: 'rewarded', rewardedAt: new Date() })
    .where(eq(schema.referrals.id, row.id));

  await db.update(schema.users)
    .set({
      freeMonthsEarned: sql`${schema.users.freeMonthsEarned} + ${REFERRER_FREE_MONTHS}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, row.referrerId));

  return true;
}
