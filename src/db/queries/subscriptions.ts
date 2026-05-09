// Subscription provisioning + usage tracking.
// Until Stripe is wired up, every user gets a 7-day Starter trial on first
// touch. The counter rolls over every 30 days (no Stripe needed for MVP).

import { eq, sql } from 'drizzle-orm';
import { requireDb, schema } from '@/db';
import {
  TRIAL_DAYS, type PlanSlug, type SubStatus,
  isSubscriptionUsable, shouldRolloverPeriod,
} from '@/lib/plan-limits';

export interface EffectiveSubscription {
  id:                 string;
  userId:             string;
  plan:               PlanSlug;
  status:             SubStatus;
  trialEndsAt:        Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd:   Date | null;
  messagesThisPeriod: number;
  /** True when the bot is allowed to respond. */
  usable:             boolean;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get the user's subscription, creating a Starter trial on first call,
 * and rolling over the billing period if it's stale.
 */
export async function getOrCreateSubscription(
  userId: string,
): Promise<EffectiveSubscription> {
  const db = requireDb();

  let sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
  });

  // Lazy-provision: first ever lookup
  if (!sub) {
    const now      = new Date();
    const trialEnd = addDays(now, TRIAL_DAYS);
    const [created] = await db.insert(schema.subscriptions).values({
      userId,
      plan:               'starter',
      status:             'trialing',
      trialEndsAt:        trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd:   trialEnd,
      messagesThisPeriod: 0,
    }).returning();
    sub = created;
  }

  // Period rollover: when current_period_end has passed and the user is
  // still on a paid status, advance to next 30 days and reset the counter.
  // (Stripe webhooks will replace this once integrated.)
  if (
    shouldRolloverPeriod(sub.currentPeriodEnd) &&
    (sub.status === 'active' || sub.status === 'trialing')
  ) {
    const newStart = sub.currentPeriodEnd ?? new Date();
    const newEnd   = addDays(newStart, 30);

    // For trial: if trial expired, mark past_due (force upgrade).
    let nextStatus: SubStatus = sub.status;
    if (sub.status === 'trialing' && sub.trialEndsAt && sub.trialEndsAt.getTime() < Date.now()) {
      nextStatus = 'past_due';
    }

    const [rolled] = await db.update(schema.subscriptions)
      .set({
        currentPeriodStart: newStart,
        currentPeriodEnd:   newEnd,
        messagesThisPeriod: 0,
        status:             nextStatus,
        updatedAt:          new Date(),
      })
      .where(eq(schema.subscriptions.id, sub.id))
      .returning();
    sub = rolled;
  }

  return {
    id:                 sub.id,
    userId:             sub.userId,
    plan:               sub.plan as PlanSlug,
    status:             sub.status as SubStatus,
    trialEndsAt:        sub.trialEndsAt,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd:   sub.currentPeriodEnd,
    messagesThisPeriod: sub.messagesThisPeriod,
    usable:             isSubscriptionUsable(sub.status as SubStatus, sub.trialEndsAt),
  };
}

/** Atomic counter bump — used after each successful widget message. */
export async function incrementMessageCount(userId: string): Promise<void> {
  const db = requireDb();
  await db.update(schema.subscriptions)
    .set({
      messagesThisPeriod: sql`${schema.subscriptions.messagesThisPeriod} + 1`,
      updatedAt:          new Date(),
    })
    .where(eq(schema.subscriptions.userId, userId));
}

/**
 * Look up the bot owner's subscription via a single join.
 * Used by /api/widget/[id]/message to enforce limits.
 */
export async function getSubscriptionForBot(
  botId: string,
): Promise<EffectiveSubscription | null> {
  const db = requireDb();
  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, botId),
    columns: { ownerId: true },
  });
  if (!bot) return null;
  return getOrCreateSubscription(bot.ownerId);
}

// ─── Stripe sync ────────────────────────────────────────────────────────────

export interface StripeSubSnapshot {
  /** Stripe Customer ID */
  stripeCustomerId:     string;
  /** Stripe Subscription ID */
  stripeSubscriptionId: string;
  plan:                 PlanSlug;
  status:               SubStatus;
  currentPeriodStart:   Date;
  currentPeriodEnd:     Date;
  trialEndsAt:          Date | null;
  cancelAtPeriodEnd:    boolean;
}

/**
 * Idempotently mirror a Stripe subscription into our DB.
 * Identifies the local row by (a) stripeSubscriptionId, then (b) userId.
 * Resets messagesThisPeriod when the period changes.
 */
export async function syncStripeSubscription(
  userId: string,
  snapshot: StripeSubSnapshot,
): Promise<void> {
  const db = requireDb();

  const existing = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
  });

  // Reset usage counter when the billing period rolls over.
  const periodChanged = !existing
    || !existing.currentPeriodEnd
    || existing.currentPeriodEnd.getTime() !== snapshot.currentPeriodEnd.getTime();

  if (existing) {
    await db.update(schema.subscriptions)
      .set({
        plan:                 snapshot.plan,
        status:               snapshot.status,
        stripeCustomerId:     snapshot.stripeCustomerId,
        stripeSubscriptionId: snapshot.stripeSubscriptionId,
        currentPeriodStart:   snapshot.currentPeriodStart,
        currentPeriodEnd:     snapshot.currentPeriodEnd,
        trialEndsAt:          snapshot.trialEndsAt,
        cancelAtPeriodEnd:    snapshot.cancelAtPeriodEnd,
        messagesThisPeriod:   periodChanged ? 0 : existing.messagesThisPeriod,
        updatedAt:            new Date(),
      })
      .where(eq(schema.subscriptions.id, existing.id));
  } else {
    await db.insert(schema.subscriptions).values({
      userId,
      plan:                 snapshot.plan,
      status:               snapshot.status,
      stripeCustomerId:     snapshot.stripeCustomerId,
      stripeSubscriptionId: snapshot.stripeSubscriptionId,
      currentPeriodStart:   snapshot.currentPeriodStart,
      currentPeriodEnd:     snapshot.currentPeriodEnd,
      trialEndsAt:          snapshot.trialEndsAt,
      cancelAtPeriodEnd:    snapshot.cancelAtPeriodEnd,
      messagesThisPeriod:   0,
    });
  }
}

/** Mark subscription as canceled (subscription.deleted webhook). */
export async function markSubscriptionCanceled(
  stripeSubscriptionId: string,
): Promise<void> {
  const db = requireDb();
  await db.update(schema.subscriptions)
    .set({ status: 'canceled', updatedAt: new Date() })
    .where(eq(schema.subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

/** Mark a subscription past_due after a failed payment. */
export async function markSubscriptionPastDue(
  stripeSubscriptionId: string,
): Promise<void> {
  const db = requireDb();
  await db.update(schema.subscriptions)
    .set({ status: 'past_due', updatedAt: new Date() })
    .where(eq(schema.subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

/** Find a user by their Stripe customer ID. */
export async function findUserByStripeCustomer(
  stripeCustomerId: string,
): Promise<string | null> {
  const db = requireDb();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.stripeCustomerId, stripeCustomerId),
    columns: { userId: true },
  });
  return sub?.userId ?? null;
}

/** Persist the Stripe Customer ID on first checkout (before subscription exists). */
export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  const db = requireDb();
  await db.update(schema.subscriptions)
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where(eq(schema.subscriptions.userId, userId));
}
