// POST /api/webhooks/lemon
// Lemon Squeezy events arrive here. We HMAC-verify the body, then mirror the
// event into our DB so subscription state is always derived from LS.
//
// Configure in LS dashboard → Settings → Webhooks:
//   URL: https://yourdomain.com/api/webhooks/lemon
//   Events: subscription_created, subscription_updated, subscription_cancelled,
//           subscription_resumed, subscription_expired, subscription_paused,
//           subscription_unpaused, subscription_payment_success,
//           subscription_payment_failed, subscription_payment_recovered
//   Signing secret → LEMONSQUEEZY_WEBHOOK_SECRET in env.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { snapshotFromLsSub } from '@/lib/lemon-mapper';
import { rewardReferralOnPayment } from '@/lib/referral';
import { logger } from '@/lib/logger';
import {
  syncLsSubscription,
  markSubscriptionCanceled,
  markSubscriptionPastDue,
  findUserByLsCustomer,
  getPrevPeriodEnd,
} from '@/db/queries/subscriptions';
import type {
  LsResource, LsSubscriptionAttrs, LsSubscriptionInvoiceAttrs,
} from '@/lib/lemon';
import {
  isEmailAvailable, sendPaymentFailedEmail, sendSubscriptionCancelledEmail,
  sendSubscriptionReceiptEmail,
} from '@/lib/email';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Subscription events deliver a `subscription` resource. */
type SubEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused';

/** Payment events deliver a `subscription-invoice` resource. */
type PaymentEvent =
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered';

interface LsWebhookEnvelope {
  meta: {
    event_name: SubEvent | PaymentEvent | string;
    custom_data?: { user_id?: string; plan?: string };
  };
  // Discriminated by event_name — payment events carry an invoice resource.
  data: LsResource<LsSubscriptionAttrs | LsSubscriptionInvoiceAttrs>;
}

const SUB_EVENTS: ReadonlySet<string> = new Set<SubEvent>([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
]);

const PAYMENT_EVENTS: ReadonlySet<string> = new Set<PaymentEvent>([
  'subscription_payment_success',
  'subscription_payment_failed',
  'subscription_payment_recovered',
]);

export async function POST(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  }
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'WEBHOOK_SECRET_NOT_SET' }, { status: 503 });
  }

  const sig = req.headers.get('x-signature');
  if (!sig) {
    return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 });
  }

  // Read raw body for signature verification, then parse JSON.
  const rawBody = await req.text();

  if (!verifySignature(rawBody, sig, secret)) {
    console.error('[lemon webhook] signature mismatch');
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
  }

  let envelope: LsWebhookEnvelope;
  try { envelope = JSON.parse(rawBody) as LsWebhookEnvelope; }
  catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }

  try {
    await handleEvent(envelope);
  } catch (e) {
    console.error('[lemon webhook] handler error:', envelope.meta?.event_name, e);
    return NextResponse.json({ error: 'HANDLER_ERROR' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** HMAC-SHA256 of the raw body using your webhook secret, hex-encoded. */
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Look up the recipient record (email + locale + prefs) for a user.
 * Returns null if email is unavailable or the user can't be found.
 */
async function loadRecipient(userId: string): Promise<{
  userId:     string;
  email:      string;
  name:       string | null;
  locale:     string;
  emailPrefs: typeof schema.users.$inferSelect['emailPrefs'];
} | null> {
  const db = getDb();
  if (!db || !isEmailAvailable()) return null;
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { id: true, email: true, name: true, locale: true, emailPrefs: true },
  });
  if (!user?.email) return null;
  return {
    userId:     user.id,
    email:      user.email,
    name:       user.name,
    locale:     user.locale,
    emailPrefs: user.emailPrefs,
  };
}

async function handleEvent(envelope: LsWebhookEnvelope): Promise<void> {
  const event = envelope.meta.event_name;
  const customUserId = envelope.meta.custom_data?.user_id ?? null;
  logger.info('lemon webhook received', { route: '/api/webhooks/lemon', event });

  // Resolve userId: prefer custom_data (set during checkout), fall back to
  // looking up by LS customer_id (for events after the first one).
  const customerId = String(envelope.data.attributes.customer_id);
  const userId = customUserId
    ?? await findUserByLsCustomer(customerId);

  if (!userId) {
    console.warn('[lemon webhook] event w/o known user', event, envelope.data.id);
    return;
  }

  // ─── Subscription events (data = subscription resource) ──────────────────
  if (SUB_EVENTS.has(event)) {
    const resource = envelope.data as LsResource<LsSubscriptionAttrs>;
    const subId = resource.id;

    // Terminal state — short-circuit to avoid sub-mapper noise.
    if (event === 'subscription_expired') {
      await markSubscriptionCanceled(subId);
      return;
    }

    // For period rollover events, use the previously stored period_end as
    // the new period_start.
    const prevEnd = await getPrevPeriodEnd(subId);
    const snap = snapshotFromLsSub(resource, prevEnd);
    if (snap) await syncLsSubscription(userId, snap);

    // Side-effect: notify the user once we've persisted DB state.
    // - subscription_created   → welcome to paid plan / receipt
    // - subscription_cancelled → confirm cancellation with end-of-access date
    // Other events (updated/resumed/paused/unpaused) are too noisy to email
    // — they'd spam during plan changes. LS itself sends those.
    if (event === 'subscription_created' && snap) {
      void dispatchReceiptEmail(userId, snap.plan, snap.status, snap.currentPeriodEnd);
    }
    if (event === 'subscription_cancelled' && snap) {
      void dispatchCancelledEmail(userId, snap.currentPeriodEnd);
    }
    return;
  }

  // ─── Payment events (data = subscription-invoice resource) ───────────────
  if (PAYMENT_EVENTS.has(event)) {
    const inv = envelope.data as LsResource<LsSubscriptionInvoiceAttrs>;
    const subId = String(inv.attributes.subscription_id);

    if (event === 'subscription_payment_failed') {
      await markSubscriptionPastDue(subId);
      void dispatchPaymentFailedEmail(userId);
    }
    if (event === 'subscription_payment_success' || event === 'subscription_payment_recovered') {
      // Renewal receipt — read fresh plan from our DB (it was just synced
      // by the corresponding subscription_updated event in 99% of cases).
      void dispatchReceiptEmailForUser(userId);
      // Referral reward: if THIS payer was referred, credit their referrer one
      // free month (idempotent — only the first pending→rewarded flip counts).
      void rewardReferralOnPayment(userId).catch(e =>
        console.error('[lemon] referral reward failed:', e));
    }
    return;
  }

  // Unknown / uninteresting event — silently ignore.
}

// ─── Side-effects: email helpers ──────────────────────────────────────────
// Each runs detached from the webhook ack so a Resend hiccup never causes
// LS to retry the whole event — that would double-count usage counters.
//
// IDEMPOTENCY: LS retries any webhook that returns non-2xx, and occasionally
// double-delivers under load. The sync helpers (syncLsSubscription, mark*)
// are already idempotent. Email is not — sending twice spams the customer.
// We dedupe email dispatch with the existing rate_limits table: the first
// call within `windowSeconds` claims the slot (allowed=true), retries hit
// the same row and get allowed=false → skip.

/**
 * Try to claim a send slot for this (event-type, key) pair. Returns false
 * if the slot is already taken (i.e. we already dispatched this email
 * within the window).
 */
async function claimEmailSlot(kind: string, key: string): Promise<boolean> {
  // 24h window — handles every realistic LS retry pattern (they retry within
  // minutes, not hours) without permanently blocking re-sends if the user
  // genuinely re-subscribes after a year.
  const rl = await checkRateLimit(rateLimitKey(['ls_email', kind, key]), 1, 86_400);
  return rl.allowed;
}

async function dispatchReceiptEmail(
  userId: string,
  plan:   string,
  status: string,
  nextBilling: Date | null,
): Promise<void> {
  if (!await claimEmailSlot('receipt', `${userId}:${nextBilling?.getTime() ?? '0'}`)) {
    console.log('[lemon webhook] receipt already sent for this period, skipping');
    return;
  }
  const to = await loadRecipient(userId);
  if (!to) return;
  await sendSubscriptionReceiptEmail({ to, plan, status, nextBilling })
    .catch(e => console.error('[lemon webhook] receipt email failed:', e));
}

/** Re-read plan/status from DB and send a receipt. Used by renewal events. */
async function dispatchReceiptEmailForUser(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
    columns: { plan: true, status: true, currentPeriodEnd: true },
  });
  if (!sub) return;
  await dispatchReceiptEmail(userId, sub.plan, sub.status, sub.currentPeriodEnd);
}

async function dispatchCancelledEmail(userId: string, endsAt: Date | null): Promise<void> {
  if (!await claimEmailSlot('cancel', userId)) {
    console.log('[lemon webhook] cancel email already sent, skipping');
    return;
  }
  const to = await loadRecipient(userId);
  if (!to) return;
  await sendSubscriptionCancelledEmail({ to, endsAt })
    .catch(e => console.error('[lemon webhook] cancel email failed:', e));
}

async function dispatchPaymentFailedEmail(userId: string): Promise<void> {
  // Dedup window: 24h. Payment retries happen on the same day; we don't
  // want to email the customer once per retry.
  if (!await claimEmailSlot('payment_failed', userId)) {
    console.log('[lemon webhook] payment-failed email already sent today, skipping');
    return;
  }
  const to = await loadRecipient(userId);
  if (!to) return;
  await sendPaymentFailedEmail({ to })
    .catch(e => console.error('[lemon webhook] payment-failed email failed:', e));
}
