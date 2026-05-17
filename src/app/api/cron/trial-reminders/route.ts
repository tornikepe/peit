// POST /api/cron/trial-reminders
//
// Daily job that:
//   1. Finds trialing subscriptions ending in 2-4 days that haven't received
//      the "trial ends in X days" email yet → sends it, sets
//      trial_reminder_sent_at.
//   2. Finds subscriptions whose trial just expired (≤24h ago) and we
//      haven't sent the "trial ended" email yet → sends it, sets
//      trial_ended_notified_at.
//
// Auth: shared CRON_SECRET in either Authorization: Bearer <secret> or
// ?secret= query (Vercel cron supports both). Skipping auth in dev when
// CRON_SECRET isn't set.

import { NextResponse } from 'next/server';
import { and, eq, gt, gte, isNull, lte, or } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { sendTrialEndedEmail, sendTrialEndingEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production'; // open in dev

  const url    = new URL(req.url);
  const header = req.headers.get('authorization');
  if (header && header === `Bearer ${secret}`) return true;
  if (url.searchParams.get('secret') === secret) return true;
  return false;
}

interface Counters {
  remindersSent:   number;
  remindersSkipped: number;
  endedSent:       number;
  endedSkipped:    number;
}

async function runJob(): Promise<Counters> {
  const db = getDb();
  if (!db) throw new Error('DB_NOT_CONFIGURED');

  const now = new Date();
  // "Trial ending in 2-4 days" window. We don't email exactly at 3 days
  // because a daily cron can drift; using a 2-day window guarantees every
  // user gets exactly one reminder regardless of when the cron fires.
  const windowStart = new Date(now.getTime() + 2 * 86_400_000); // +2d
  const windowEnd   = new Date(now.getTime() + 4 * 86_400_000); // +4d

  // ── 1. Trial-ending reminder ──────────────────────────────────────────
  const ending = await db
    .select({
      userId:    schema.subscriptions.userId,
      subId:     schema.subscriptions.id,
      trialEnds: schema.subscriptions.trialEndsAt,
      email:     schema.users.email,
      name:      schema.users.name,
      locale:    schema.users.locale,
      prefs:     schema.users.emailPrefs,
    })
    .from(schema.subscriptions)
    .innerJoin(schema.users, eq(schema.users.id, schema.subscriptions.userId))
    .where(and(
      eq(schema.subscriptions.status, 'trialing'),
      isNull(schema.subscriptions.trialReminderSentAt),
      gte(schema.subscriptions.trialEndsAt, windowStart),
      lte(schema.subscriptions.trialEndsAt, windowEnd),
    ));

  const counters: Counters = {
    remindersSent: 0, remindersSkipped: 0, endedSent: 0, endedSkipped: 0,
  };

  for (const row of ending) {
    if (!row.trialEnds || !row.email) {
      counters.remindersSkipped++;
      continue;
    }
    const daysLeft = Math.max(1, Math.ceil((row.trialEnds.getTime() - now.getTime()) / 86_400_000));

    const sent = await sendTrialEndingEmail({
      to: {
        userId:     row.userId,
        email:      row.email,
        name:       row.name,
        locale:     row.locale,
        emailPrefs: row.prefs,
      },
      daysLeft,
    });

    // Always stamp the timestamp — even if email opted-out we don't want to
    // try again tomorrow. The user explicitly asked not to be reminded.
    await db.update(schema.subscriptions)
      .set({ trialReminderSentAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.subscriptions.id, row.subId));

    if (sent) counters.remindersSent++; else counters.remindersSkipped++;
  }

  // ── 2. Trial-ended notice ─────────────────────────────────────────────
  // Status flips to past_due via the getOrCreateSubscription rollover OR
  // via the LS webhook. Either way, trial_ends_at is in the past and
  // status is "past_due". We notify the first time we see that state.
  // Also catch the legacy case where rollover hasn't run yet (still
  // trialing but trial_ends_at is in the past).
  const ended = await db
    .select({
      userId:    schema.subscriptions.userId,
      subId:     schema.subscriptions.id,
      email:     schema.users.email,
      name:      schema.users.name,
      locale:    schema.users.locale,
      prefs:     schema.users.emailPrefs,
    })
    .from(schema.subscriptions)
    .innerJoin(schema.users, eq(schema.users.id, schema.subscriptions.userId))
    .where(and(
      or(
        eq(schema.subscriptions.status, 'past_due'),
        eq(schema.subscriptions.status, 'trialing'),
      )!,
      isNull(schema.subscriptions.trialEndedNotifiedAt),
      lte(schema.subscriptions.trialEndsAt, now),
      // Don't notify accounts whose trial ended ages ago (e.g. test/seeded
      // accounts) — only those whose trial ended within the past 7 days.
      gt(schema.subscriptions.trialEndsAt, new Date(now.getTime() - 7 * 86_400_000)),
    ));

  for (const row of ended) {
    if (!row.email) {
      counters.endedSkipped++;
      continue;
    }
    const sent = await sendTrialEndedEmail({
      to: {
        userId:     row.userId,
        email:      row.email,
        name:       row.name,
        locale:     row.locale,
        emailPrefs: row.prefs,
      },
    });

    await db.update(schema.subscriptions)
      .set({ trialEndedNotifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.subscriptions.id, row.subId));

    if (sent) counters.endedSent++; else counters.endedSkipped++;
  }

  return counters;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  try {
    const counters = await runJob();
    return NextResponse.json({ ok: true, ...counters });
  } catch (e) {
    if (e instanceof Error && e.message === 'DB_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
    }
    console.error('[cron/trial-reminders] failed:', e);
    return NextResponse.json({
      error:   'INTERNAL',
      message: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Vercel cron sends GET — accept both verbs so manual curl debugging works too.
export const GET = POST;
