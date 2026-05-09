// Map between our internal plan slugs and the Stripe Price IDs.
// The Price IDs come from your Stripe dashboard — set them in .env.local:
//
//   STRIPE_PRICE_STARTER=price_...
//   STRIPE_PRICE_PRO=price_...
//   STRIPE_PRICE_BUSINESS=price_...
//
// Enterprise has no Price ID — it's "contact sales" only.

import type { PlanSlug } from './plan-limits';

export const PLAN_DISPLAY: Record<PlanSlug, {
  name:        string;
  priceUsd:    number;     // monthly USD
  priceGel:    number;     // approx GEL
  trialDays:   number;
  popularBadge?: boolean;
}> = {
  starter: {
    name:      'Starter',
    priceUsd:  19,
    priceGel:  52,
    trialDays: 7,
  },
  pro: {
    name:      'Pro',
    priceUsd:  49,
    priceGel:  135,
    trialDays: 7,
    popularBadge: true,
  },
  business: {
    name:      'Business',
    priceUsd:  99,
    priceGel:  273,
    trialDays: 7,
  },
  enterprise: {
    name:      'Enterprise',
    priceUsd:  0,    // custom pricing
    priceGel:  0,
    trialDays: 0,
  },
};

/** Returns the configured Stripe Price ID for a plan, or null if unset. */
export function priceIdFor(plan: PlanSlug): string | null {
  switch (plan) {
    case 'starter':    return process.env.STRIPE_PRICE_STARTER  ?? null;
    case 'pro':        return process.env.STRIPE_PRICE_PRO      ?? null;
    case 'business':   return process.env.STRIPE_PRICE_BUSINESS ?? null;
    case 'enterprise': return null;  // contact sales
  }
}

/** Reverse lookup: which plan does this Stripe Price ID belong to? */
export function planForPriceId(priceId: string): PlanSlug | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER)  return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO)      return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business';
  return null;
}

/** True if all required Stripe price IDs are configured. */
export function arePricesConfigured(): boolean {
  return !!(
    process.env.STRIPE_PRICE_STARTER &&
    process.env.STRIPE_PRICE_PRO &&
    process.env.STRIPE_PRICE_BUSINESS
  );
}
