// Map between our internal plan slugs and Lemon Squeezy Variant IDs.
// The variant IDs come from your LS dashboard → Store → Products → click a
// product → each price tier is a "Variant" with a numeric ID. Set them in
// .env.local:
//
//   LEMONSQUEEZY_VARIANT_BASIC=123456
//   LEMONSQUEEZY_VARIANT_PRO=123457
//   LEMONSQUEEZY_VARIANT_ULTIMATE=123458
//
// Enterprise has no variant — it's "contact sales" only.
//
// Trial days are configured per-variant inside the LS dashboard, NOT here —
// the value in PLAN_DISPLAY below is for marketing copy only.

import type { PlanSlug } from './plan-limits';

export const PLAN_DISPLAY: Record<PlanSlug, {
  name:        string;
  priceUsd:    number;     // monthly USD
  priceGel:    number;     // approx GEL (display only — LS handles FX)
  trialDays:   number;
  popularBadge?: boolean;
}> = {
  basic: {
    name:      'Basic',
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
  ultimate: {
    name:      'Ultimate',
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

/** Returns the configured LS variant ID for a plan, or null if unset. */
export function variantIdFor(plan: PlanSlug): string | null {
  switch (plan) {
    case 'basic':      return process.env.LEMONSQUEEZY_VARIANT_BASIC    ?? null;
    case 'pro':        return process.env.LEMONSQUEEZY_VARIANT_PRO      ?? null;
    case 'ultimate':   return process.env.LEMONSQUEEZY_VARIANT_ULTIMATE ?? null;
    case 'enterprise': return null;  // contact sales
  }
}

/** Reverse lookup: which plan does this LS variant ID belong to? */
export function planForVariantId(variantId: string | number): PlanSlug | null {
  const v = String(variantId);
  if (v === process.env.LEMONSQUEEZY_VARIANT_BASIC)    return 'basic';
  if (v === process.env.LEMONSQUEEZY_VARIANT_PRO)      return 'pro';
  if (v === process.env.LEMONSQUEEZY_VARIANT_ULTIMATE) return 'ultimate';
  return null;
}

/** True if all required LS variant IDs are configured. */
export function areVariantsConfigured(): boolean {
  return !!(
    process.env.LEMONSQUEEZY_VARIANT_BASIC &&
    process.env.LEMONSQUEEZY_VARIANT_PRO &&
    process.env.LEMONSQUEEZY_VARIANT_ULTIMATE
  );
}
