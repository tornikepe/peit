// Plan limits — single source of truth for what each tier can do.
// These match the pricing card on the landing page.

export type PlanSlug = 'basic' | 'pro' | 'ultimate' | 'enterprise';
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface PlanLimits {
  /** Max bots a user can create. */
  bots: number;
  /** Max messages handled per billing period (per user). */
  messagesPerMonth: number;
  /** Hard ceiling on Claude tokens billed per period (input + output, excluding
   *  cached reads). Acts as cost shield against runaway prompts. */
  tokensPerMonth: number;
  /** Max chunks per bot (controls AI Index cost). */
  chunksPerBot: number;
  /** Max FAQ entries per bot. */
  faqsPerBot: number;
  /** Allows custom domain allowlist. */
  domainAllowlist: boolean;
  /** Hides "Powered by Peit" footer in widget. */
  removeBranding: boolean;
}

// Token caps sized to comfortably exceed `messagesPerMonth × ~600 tokens/reply`
// with headroom for system-prompt + chunk grounding. Enterprise stays unbounded.
export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  basic: {
    bots:            1,
    messagesPerMonth: 1_000,
    tokensPerMonth:  2_000_000,
    chunksPerBot:    50,
    faqsPerBot:      20,
    domainAllowlist: false,
    removeBranding:  false,
  },
  pro: {
    bots:            5,
    messagesPerMonth: 10_000,
    tokensPerMonth:  20_000_000,
    chunksPerBot:    200,
    faqsPerBot:      100,
    domainAllowlist: true,
    removeBranding:  false,
  },
  ultimate: {
    bots:            20,
    messagesPerMonth: 100_000,
    tokensPerMonth:  200_000_000,
    chunksPerBot:    1_000,
    faqsPerBot:      500,
    domainAllowlist: true,
    removeBranding:  true,
  },
  enterprise: {
    bots:            Number.POSITIVE_INFINITY,
    messagesPerMonth: Number.POSITIVE_INFINITY,
    tokensPerMonth:  Number.POSITIVE_INFINITY,
    chunksPerBot:    Number.POSITIVE_INFINITY,
    faqsPerBot:      Number.POSITIVE_INFINITY,
    domainAllowlist: true,
    removeBranding:  true,
  },
};

export function getLimits(plan: PlanSlug): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.basic;
}

/** Trial = Basic limits, time-boxed. */
export const TRIAL_DAYS = 7;

/**
 * Subscription is "usable" when status is trialing (within window) or active.
 * past_due/canceled/incomplete → bot stops responding, user must re-pay.
 */
export function isSubscriptionUsable(
  status: SubStatus,
  trialEndsAt: Date | null,
): boolean {
  if (status === 'active') return true;
  if (status === 'trialing') {
    if (!trialEndsAt) return true;
    return trialEndsAt.getTime() > Date.now();
  }
  return false;
}

/**
 * Bills are 30-day cycles for free trial; LS sets actual periods on paid.
 * If period_end is in the past, advance to next 30-day window and reset counter.
 */
export function shouldRolloverPeriod(currentPeriodEnd: Date | null): boolean {
  if (!currentPeriodEnd) return false;
  return currentPeriodEnd.getTime() < Date.now();
}
