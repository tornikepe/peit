// GET /api/settings/billing  → { plan, status, trialEndsAt, currentPeriodEnd, limits, invoices }
//
// The legacy /dashboard/billing endpoint pulls subscription state from
// our subscriptions table (already synced by the Lemon Squeezy webhook).
// The settings page reuses the same data so there's a single source of
// truth — no separate Stripe/LS API call here.
//
// Invoices come from Lemon Squeezy's `/subscription-invoices` endpoint
// when configured. If LS isn't reachable we return `invoices: []` so the
// UI degrades to "plan info only" without erroring.

import { eq } from 'drizzle-orm';
import { withAuth } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { isLemonAvailable, lsFetch } from '@/lib/lemon';
import { getLimits, type PlanSlug } from '@/lib/plan-limits';

export const runtime = 'nodejs';

interface LsInvoice {
  id: string;
  attributes: {
    created_at:   string;
    status:       string;
    total:        number;
    currency:     string;
    invoice_url?: string | null;
  };
}

export const GET = withAuth(async ({ user }) => {
  const db = requireDb();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!sub) {
    // No subscription row yet — the trial wasn't provisioned (e.g. user
    // signed in via Clerk but never hit a server handler that calls
    // getOrCreateSubscription). Return a sensible default.
    return {
      plan: 'basic',
      status: 'trialing',
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      limits: getLimits('basic'),
      usage: { messages: 0, tokensIn: 0, tokensOut: 0 },
      invoices: [],
    };
  }

  // Pull invoices from LS only when the customer has a stored LS ID.
  let invoices: Array<{
    id:        string;
    createdAt: string;
    amount:    number;
    currency:  string;
    status:    string;
    url:       string | null;
  }> = [];

  if (isLemonAvailable() && sub.lsSubscriptionId) {
    try {
      const res = await lsFetch<{ data: LsInvoice[] }>(
        `/subscription-invoices?filter[subscription_id]=${sub.lsSubscriptionId}`,
      );
      invoices = (res.data ?? []).map(i => ({
        id:        i.id,
        createdAt: i.attributes.created_at,
        amount:    i.attributes.total,
        currency:  i.attributes.currency,
        status:    i.attributes.status,
        url:       i.attributes.invoice_url ?? null,
      }));
    } catch (e) {
      // Don't fail the whole settings page on a flaky LS — show empty.
      console.warn('[settings/billing] invoice fetch failed:', e);
    }
  }

  const limits = getLimits(sub.plan as PlanSlug);

  return {
    plan:              sub.plan,
    status:            sub.status,
    trialEndsAt:       sub.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd:  sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    limits,
    usage: {
      messages: sub.messagesThisPeriod,
      tokensIn:  sub.tokensInputThisPeriod,
      tokensOut: sub.tokensOutputThisPeriod,
    },
    invoices,
  };
});
