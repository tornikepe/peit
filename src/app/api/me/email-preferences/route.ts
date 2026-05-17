// GET   /api/me/email-preferences — read current prefs
// PATCH /api/me/email-preferences — update (partial allowed)
//
// Body shape (partial):
//   {
//     locale?:        "ka" | "en" | "ru",
//     leadAlerts?:    boolean,
//     productUpdates?: boolean,
//     trialReminders?: boolean
//   }
//
// Auth: Clerk session. The withAuth helper provisions the DB user row if
// it's their first call, so this also lazily creates defaults for users
// who signed up before email_prefs existed.

import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { getDb, schema } from '@/db';
import { DEFAULT_EMAIL_PREFS, type EmailPrefs } from '@/db/schema';

export const runtime = 'nodejs';

interface PatchBody {
  locale?:         string;
  leadAlerts?:     boolean;
  productUpdates?: boolean;
  trialReminders?: boolean;
}

const VALID_LOCALES = new Set(['ka', 'en', 'ru']);

export const GET = withAuth(async ({ user }) => ({
  ok:     true,
  locale: user.locale,
  prefs:  user.emailPrefs ?? DEFAULT_EMAIL_PREFS,
}));

export const PATCH = withAuth(async ({ user, req }) => {
  const db = getDb()!;

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON');
  }

  // Build sanitised next-state. Reject unknown locales but accept partial
  // pref updates — anything not in body keeps its current value.
  const current: EmailPrefs = user.emailPrefs ?? DEFAULT_EMAIL_PREFS;
  const nextPrefs: EmailPrefs = {
    leadAlerts:     typeof body.leadAlerts     === 'boolean' ? body.leadAlerts     : current.leadAlerts,
    productUpdates: typeof body.productUpdates === 'boolean' ? body.productUpdates : current.productUpdates,
    trialReminders: typeof body.trialReminders === 'boolean' ? body.trialReminders : current.trialReminders,
  };

  let nextLocale = user.locale;
  if (typeof body.locale === 'string') {
    if (!VALID_LOCALES.has(body.locale)) {
      return jsonError(400, 'INVALID_LOCALE');
    }
    nextLocale = body.locale;
  }

  await db.update(schema.users)
    .set({
      emailPrefs: nextPrefs,
      locale:     nextLocale,
      updatedAt:  new Date(),
    })
    .where(eq(schema.users.id, user.id));

  return {
    ok:     true,
    locale: nextLocale,
    prefs:  nextPrefs,
  };
});
