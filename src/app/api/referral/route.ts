// GET /api/referral — current user's referral code, link, stats, referred list.

import { eq, desc } from 'drizzle-orm';
import { withAuth } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { ensureReferralCode, REFERRED_DISCOUNT_PERCENT, REFERRER_FREE_MONTHS } from '@/lib/referral';

export const runtime = 'nodejs';

/** Obfuscate an email for display: "tornike@gmail.com" → "to•••@gmail.com". */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '•••';
  const head = local.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export const GET = withAuth(async ({ user }) => {
  const db = requireDb();
  const code = await ensureReferralCode(user);

  const rows = await db
    .select({
      status:    schema.referrals.status,
      createdAt: schema.referrals.createdAt,
      email:     schema.users.email,
      name:      schema.users.name,
    })
    .from(schema.referrals)
    .innerJoin(schema.users, eq(schema.users.id, schema.referrals.referredId))
    .where(eq(schema.referrals.referrerId, user.id))
    .orderBy(desc(schema.referrals.createdAt));

  const stats = {
    total:    rows.length,
    pending:  rows.filter(r => r.status === 'pending').length,
    rewarded: rows.filter(r => r.status === 'rewarded').length,
    freeMonthsEarned: user.freeMonthsEarned,
  };

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://peit.vercel.app').replace(/\/$/, '');

  return {
    code,
    link: `${appUrl}/signup?ref=${encodeURIComponent(code)}`,
    rewardRules: {
      referredDiscountPercent: REFERRED_DISCOUNT_PERCENT,
      referrerFreeMonths:      REFERRER_FREE_MONTHS,
    },
    stats,
    referred: rows.map(r => ({
      email:    maskEmail(r.email),
      joinedAt: r.createdAt,
      status:   r.status,
    })),
  };
});
