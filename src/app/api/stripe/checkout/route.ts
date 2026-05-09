// POST /api/stripe/checkout
// Body: { plan: 'starter' | 'pro' | 'business' }
// Returns: { url: string } — Stripe-hosted checkout URL

import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { getStripe, getAppUrl, isStripeAvailable } from '@/lib/stripe';
import { priceIdFor } from '@/lib/plan-prices';
import { getOrCreateSubscription, setStripeCustomerId } from '@/db/queries/subscriptions';
import type { PlanSlug } from '@/lib/plan-limits';
import { TRIAL_DAYS } from '@/lib/plan-limits';

export const runtime = 'nodejs';

export const POST = withAuth(async ({ user, req }) => {
  if (!isStripeAvailable()) return jsonError(503, 'STRIPE_NOT_CONFIGURED');

  let body: { plan?: string };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const plan = body.plan as PlanSlug;
  if (!plan || !['starter', 'pro', 'business'].includes(plan)) {
    return jsonError(400, 'INVALID_PLAN');
  }

  const priceId = priceIdFor(plan);
  if (!priceId) {
    return jsonError(503, 'PRICE_NOT_CONFIGURED', `Set STRIPE_PRICE_${plan.toUpperCase()} in env`);
  }

  const stripe = getStripe()!;
  const sub = await getOrCreateSubscription(user.id);
  const appUrl = getAppUrl(req);

  // Reuse the existing customer if we already have one.
  let customerId = sub.id ? (await loadCustomerId(user.id)) : null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:  user.name ?? undefined,
      metadata: { userId: user.id, clerkId: user.clerkId },
    });
    customerId = customer.id;
    await setStripeCustomerId(user.id, customerId);
  }

  // Don't double-trial: if they had a trial that already expired, don't grant another.
  const trialAlreadyConsumed =
    sub.trialEndsAt && sub.trialEndsAt.getTime() < Date.now();

  const session = await stripe.checkout.sessions.create({
    mode:                 'subscription',
    customer:             customerId,
    line_items:           [{ price: priceId, quantity: 1 }],
    success_url:          `${appUrl}/dashboard?checkout=success&plan=${plan}`,
    cancel_url:           `${appUrl}/pricing?checkout=canceled`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    subscription_data: {
      trial_period_days: trialAlreadyConsumed ? undefined : TRIAL_DAYS,
      metadata:          { userId: user.id, plan },
    },
    metadata: { userId: user.id, plan },
  });

  if (!session.url) return jsonError(500, 'NO_CHECKOUT_URL');
  return { url: session.url };
});

async function loadCustomerId(userId: string): Promise<string | null> {
  const db = requireDb();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
    columns: { stripeCustomerId: true },
  });
  return sub?.stripeCustomerId ?? null;
}
