// Maps Stripe subscription objects → our internal StripeSubSnapshot.

import type Stripe from 'stripe';
import type { StripeSubSnapshot } from '@/db/queries/subscriptions';
import { planForPriceId } from './plan-prices';
import type { PlanSlug, SubStatus } from './plan-limits';

function epochToDate(epochSeconds: number | null | undefined): Date | null {
  if (!epochSeconds) return null;
  return new Date(epochSeconds * 1000);
}

/** Stripe statuses → our internal enum. */
function mapStatus(s: Stripe.Subscription.Status): SubStatus {
  switch (s) {
    case 'active':              return 'active';
    case 'trialing':            return 'trialing';
    case 'past_due':            return 'past_due';
    case 'canceled':            return 'canceled';
    case 'incomplete':          return 'incomplete';
    case 'incomplete_expired':  return 'canceled';
    case 'unpaid':              return 'past_due';
    case 'paused':              return 'past_due';
    default:                    return 'incomplete';
  }
}

/**
 * Convert a Stripe subscription into the snapshot our DB layer expects.
 * Uses the *first* subscription item's price to identify the plan.
 */
export function snapshotFromStripeSub(
  sub: Stripe.Subscription,
): StripeSubSnapshot | null {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  if (!item) return null;

  const priceId = item.price.id;
  const plan: PlanSlug | null = planForPriceId(priceId);
  if (!plan) {
    console.warn('[stripe-mapper] unknown price ID:', priceId);
    return null;
  }

  // Stripe v22 puts period dates on the SubscriptionItem (not the parent).
  const start = epochToDate(item.current_period_start) ?? new Date();
  const end   = epochToDate(item.current_period_end)   ?? new Date(Date.now() + 30 * 86_400_000);

  return {
    stripeCustomerId:     customerId,
    stripeSubscriptionId: sub.id,
    plan,
    status:               mapStatus(sub.status),
    currentPeriodStart:   start,
    currentPeriodEnd:     end,
    trialEndsAt:          epochToDate(sub.trial_end),
    cancelAtPeriodEnd:    sub.cancel_at_period_end ?? false,
  };
}
