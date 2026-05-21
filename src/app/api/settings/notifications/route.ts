// GET   /api/settings/notifications → current EmailPrefs
// PATCH /api/settings/notifications → partial update; auto-saved by UI
//
// Backed by `users.email_prefs` (jsonb) — same column already powering
// the lead-alert / trial-reminder / unsubscribe flows. The settings UI
// surfaces three toggles; the legacy flags (`productUpdates`,
// `trialReminders`) remain read/writeable for callers that need them.

import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import { DEFAULT_EMAIL_PREFS, type EmailPrefs } from '@/db/schema';

export const runtime = 'nodejs';

function resolvePrefs(row: { emailPrefs: EmailPrefs | null }): EmailPrefs {
  return { ...DEFAULT_EMAIL_PREFS, ...(row.emailPrefs ?? {}) };
}

export const GET = withAuth(async ({ user }) => ({
  prefs: resolvePrefs({ emailPrefs: user.emailPrefs }),
}));

const TOGGLES = [
  'leadAlerts',
  'handoffAlerts',
  'weeklyReport',
  'productUpdates',
  'trialReminders',
] as const;

type ToggleKey = (typeof TOGGLES)[number];

export const PATCH = withAuth(async ({ user, req }) => {
  let body: Partial<Record<ToggleKey, unknown>>;
  try { body = await req.json() as Partial<Record<ToggleKey, unknown>>; }
  catch { return jsonError(400, 'INVALID_JSON'); }

  // Merge defensively: start from the existing prefs (which may be null
  // on legacy rows), validate each incoming key against the allowlist,
  // and only accept booleans. Unknown keys are silently dropped.
  const current = resolvePrefs({ emailPrefs: user.emailPrefs });
  const next: EmailPrefs = { ...current };
  for (const k of TOGGLES) {
    if (k in body && typeof body[k] === 'boolean') {
      next[k] = body[k] as boolean;
    }
  }

  const db = requireDb();
  await db.update(schema.users)
    .set({ emailPrefs: next, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  return { ok: true, prefs: next };
});
