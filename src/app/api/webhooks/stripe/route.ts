// POST /api/webhooks/stripe
// Stripe events arrive here. We verify the signature, then mirror the
// event into our DB so subscription state is always derived from Stripe.
//
// Configure in Stripe dashboard → Developers → Webhooks:
//   URL: https://yourdomain.com/api/webhooks/stripe
//   Events: checkout.session.completed,
//           customer.subscription.created,
//           customer.subscription.updated,
//           customer.subscription.deleted,
//           invoice.payment_succeeded,
//           invoice.payment_failed
//   Signing secret → STRIPE_WEBHOOK_SECRET in env.

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeAvailable } from '@/lib/stripe';
import { snapshotFromStripeSub } from '@/lib/stripe-mapper';
import {
  syncStripeSubscription,
  markSubscriptionCanceled,
  markSubscriptionPastDue,
  findUserByStripeCustomer,
} from '@/db/queries/subscriptions';
import { getDb } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isStripeAvailable()) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 });
  }
  if (!getDb()) {
    return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'WEBHOOK_SECRET_NOT_SET' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 });
  }

  // Read raw body — required for signature verification
  const rawBody = await req.text();

  const stripe = getStripe()!;
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (e) {
    console.error('[stripe webhook] signature failed:', e);
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
  }

  try {
    await handleEvent(event, stripe);
  } catch (e) {
    console.error('[stripe webhook] handler error:', event.type, e);
    return NextResponse.json({ error: 'HANDLER_ERROR' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event, stripe: Stripe) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subId  = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (!userId || !subId) {
        console.warn('[stripe webhook] checkout.session.completed missing userId/subId');
        return;
      }
      const sub = await stripe.subscriptions.retrieve(subId);
      const snap = snapshotFromStripeSub(sub);
      if (snap) await syncStripeSubscription(userId, snap);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      let userId: string | null = sub.metadata?.userId ?? null;
      if (!userId) {
        userId = await findUserByStripeCustomer(customerId);
      }
      if (!userId) {
        console.warn('[stripe webhook] subscription event w/o known user', sub.id);
        return;
      }
      const snap = snapshotFromStripeSub(sub);
      if (snap) await syncStripeSubscription(userId, snap);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await markSubscriptionCanceled(sub.id);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      // The subscription id lives on the parent.subscription_details
      const subRef = (invoice as unknown as {
        parent?: { subscription_details?: { subscription?: string } };
        subscription?: string | Stripe.Subscription | null;
      });
      const subId = subRef.parent?.subscription_details?.subscription
        ?? (typeof subRef.subscription === 'string' ? subRef.subscription : subRef.subscription?.id);
      if (!subId) return;
      const sub = await stripe.subscriptions.retrieve(subId);
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const userId = (await findUserByStripeCustomer(customerId)) ?? sub.metadata?.userId;
      if (!userId) return;
      const snap = snapshotFromStripeSub(sub);
      if (snap) await syncStripeSubscription(userId, snap);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = (invoice as unknown as {
        parent?: { subscription_details?: { subscription?: string } };
        subscription?: string | Stripe.Subscription | null;
      });
      const subId = subRef.parent?.subscription_details?.subscription
        ?? (typeof subRef.subscription === 'string' ? subRef.subscription : subRef.subscription?.id);
      if (subId) await markSubscriptionPastDue(subId);
      break;
    }

    default:
      // Other events ignored — Stripe sends many that we don't care about.
      break;
  }
}
