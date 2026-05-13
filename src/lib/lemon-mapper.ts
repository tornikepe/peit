// Maps Lemon Squeezy subscription objects → our internal LsSubSnapshot.

import type { LsResource, LsSubscriptionAttrs } from './lemon';
import type { LsSubSnapshot } from '@/db/queries/subscriptions';
import { planForVariantId } from './plan-prices';
import type { PlanSlug, SubStatus } from './plan-limits';

/** LS status → our internal enum.
 *
 *   on_trial  → trialing
 *   active    → active
 *   paused    → past_due  (we don't have a paused state; treat like blocked)
 *   past_due  → past_due
 *   unpaid    → past_due
 *   cancelled → active    (LS keeps access until ends_at; flag cancelAtPeriodEnd)
 *   expired   → canceled
 */
function mapStatus(s: LsSubscriptionAttrs['status']): SubStatus {
  switch (s) {
    case 'on_trial':  return 'trialing';
    case 'active':    return 'active';
    case 'cancelled': return 'active';      // still has access; ends_at will end it
    case 'past_due':
    case 'unpaid':
    case 'paused':    return 'past_due';
    case 'expired':   return 'canceled';
    default:          return 'incomplete';
  }
}

function isoToDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Convert a LS subscription resource into the snapshot our DB layer expects.
 *
 * period_end:
 *   - on trial → trial_ends_at
 *   - active   → renews_at
 *   - cancelled (scheduled cancel) → ends_at
 *
 * period_start is derived: previous renews_at if known via `prevPeriodEnd`,
 * otherwise the subscription's created_at (best-effort initial value).
 */
export function snapshotFromLsSub(
  resource: LsResource<LsSubscriptionAttrs>,
  prevPeriodEnd: Date | null = null,
): LsSubSnapshot | null {
  const a = resource.attributes;
  const plan: PlanSlug | null = planForVariantId(a.variant_id);
  if (!plan) {
    console.warn('[lemon-mapper] unknown variant id:', a.variant_id);
    return null;
  }

  const trialEndsAt = isoToDate(a.trial_ends_at);
  const renewsAt    = isoToDate(a.renews_at);
  const endsAt      = isoToDate(a.ends_at);
  const createdAt   = isoToDate(a.created_at) ?? new Date();

  // Choose the active period end-date.
  const periodEnd =
    (a.status === 'on_trial' ? trialEndsAt : null)
    ?? endsAt                  // cancelled but still has access until this date
    ?? renewsAt                // active recurring
    ?? new Date(Date.now() + 30 * 86_400_000);

  // Period start: prefer the previously stored period_end (cycle rollover),
  // fall back to subscription creation date.
  const periodStart = prevPeriodEnd ?? createdAt;

  return {
    lsCustomerId:     String(a.customer_id),
    lsSubscriptionId: resource.id,
    lsVariantId:      String(a.variant_id),
    plan,
    status:            mapStatus(a.status),
    currentPeriodStart: periodStart,
    currentPeriodEnd:   periodEnd,
    trialEndsAt,
    cancelAtPeriodEnd:  a.cancelled,
  };
}
