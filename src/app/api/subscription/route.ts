// GET /api/subscription — returns the current user's plan + usage stats.

import { withAuth } from '@/app/api/_helpers';
import { getOrCreateSubscription } from '@/db/queries/subscriptions';
import { countBotsForUser } from '@/db/queries/bots';
import { getLimits } from '@/lib/plan-limits';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => {
  const sub = await getOrCreateSubscription(user.id);
  const botCount = await countBotsForUser(user.id);
  const limits = getLimits(sub.plan);

  return {
    ok: true,
    subscription: {
      plan:               sub.plan,
      status:             sub.status,
      usable:             sub.usable,
      trialEndsAt:        sub.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd:   sub.currentPeriodEnd?.toISOString() ?? null,
      messagesThisPeriod: sub.messagesThisPeriod,
    },
    usage: {
      bots:     botCount,
      messages: sub.messagesThisPeriod,
    },
    limits: {
      bots:             Number.isFinite(limits.bots) ? limits.bots : null,
      messagesPerMonth: Number.isFinite(limits.messagesPerMonth) ? limits.messagesPerMonth : null,
      chunksPerBot:     Number.isFinite(limits.chunksPerBot) ? limits.chunksPerBot : null,
      faqsPerBot:       Number.isFinite(limits.faqsPerBot) ? limits.faqsPerBot : null,
      domainAllowlist:  limits.domainAllowlist,
      removeBranding:   limits.removeBranding,
    },
  };
});
