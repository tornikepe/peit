// GET   /api/settings/profile  → { name, email, imageUrl, locale }
// PATCH /api/settings/profile  → { name?, locale? }
//
// Email + imageUrl are owned by Clerk; we mirror them into our users
// table on first sign-in (queries/users.ts) and refresh on read here so
// the profile page always shows the same identity Clerk shows. The
// editable fields on our side are `name` (display name shown in invite
// emails and the dashboard greeting) and `locale` (email-language pref).

import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => ({
  profile: {
    name:     user.name,
    email:    user.email,
    imageUrl: user.imageUrl,
    locale:   user.locale,
    // The Clerk-owned bits (password, email, avatar) flow through
    // Clerk's hosted account portal; surface the deep-link so the UI
    // can offer a one-click "manage" button.
    manageAccountUrl: `https://accounts.clerk.com/user`,
  },
}));

interface PatchBody { name?: unknown; locale?: unknown }

export const PATCH = withAuth(async ({ user, req }) => {
  const db = requireDb();

  let body: PatchBody;
  try { body = await req.json() as PatchBody; }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const update: { name?: string; locale?: string; updatedAt: Date } = { updatedAt: new Date() };

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return jsonError(400, 'INVALID_NAME');
    }
    update.name = body.name.trim().slice(0, 120);
  }

  if (body.locale !== undefined) {
    if (typeof body.locale !== 'string' || !['ka', 'en', 'ru'].includes(body.locale)) {
      return jsonError(400, 'INVALID_LOCALE', 'locale must be ka, en or ru');
    }
    update.locale = body.locale;
  }

  await db.update(schema.users).set(update).where(eq(schema.users.id, user.id));

  const fresh = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) });
  return {
    ok: true,
    profile: fresh ? {
      name: fresh.name, email: fresh.email, imageUrl: fresh.imageUrl, locale: fresh.locale,
    } : null,
  };
});
