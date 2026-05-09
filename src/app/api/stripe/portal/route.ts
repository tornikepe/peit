// POST /api/stripe/portal
// Returns: { url: string } — Stripe-hosted customer portal session.
// Customer can: change plan, cancel, update card, view invoices.

import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { getStripe, getAppUrl, isStripeAvailable } from '@/lib/stripe';

export const runtime = 'nodejs';

export const POST = withAuth(async ({ user, req }) => {
  if (!isStripeAvailable()) return jsonError(503, 'STRIPE_NOT_CONFIGURED');

  const db = requireDb();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
    columns: { stripeCustomerId: true },
  });

  if (!sub?.stripeCustomerId) {
    return jsonError(404, 'NO_CUSTOMER', 'No Stripe customer yet — checkout first.');
  }

  const stripe = getStripe()!;
  const appUrl = getAppUrl(req);

  const session = await stripe.billingPortal.sessions.create({
    customer:   sub.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  return { url: session.url };
});
