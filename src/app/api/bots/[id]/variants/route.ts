// /api/bots/[id]/variants — CRUD for greeting A/B variants (Feature #6).
//
// GET    → list all variants for this bot, with impressions/conversions.
// POST   → create a new variant. Body: { message: string, weight?: number }.
// PATCH  → bulk update by id. Body: Array<{ id, message?, weight?, isActive? }>.
// DELETE → remove variants by id. Body: { ids: string[] }.

import { and, asc, eq, inArray } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';

export const runtime = 'nodejs';

async function ownsBot(userId: string, botId: string): Promise<boolean> {
  const db = requireDb();
  const row = await db.query.bots.findFirst({
    where: and(eq(schema.bots.id, botId), eq(schema.bots.ownerId, userId)),
    columns: { id: true },
  });
  return !!row;
}

export const GET = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  const db = requireDb();
  const variants = await db.query.greetingVariants.findMany({
    where: eq(schema.greetingVariants.botId, params.id),
    orderBy: [asc(schema.greetingVariants.createdAt)],
  });
  return { ok: true, variants };
});

export const POST = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: { message?: unknown; weight?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
  if (!message) return jsonError(400, 'INVALID_MESSAGE');
  const weight = Math.max(1, Math.min(1000,
    typeof body.weight === 'number' ? Math.round(body.weight) : 50));

  const db = requireDb();
  const [inserted] = await db.insert(schema.greetingVariants).values({
    botId: params.id, message, weight,
  }).returning();

  return { ok: true, variant: inserted };
});

export const PATCH = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: Array<{ id?: unknown; message?: unknown; weight?: unknown; isActive?: unknown }>;
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }
  if (!Array.isArray(body)) return jsonError(400, 'INVALID_BODY');

  const db = requireDb();
  for (const v of body) {
    if (typeof v.id !== 'string') continue;
    const update: Record<string, unknown> = {};
    if (typeof v.message  === 'string') update.message  = v.message.trim().slice(0, 500);
    if (typeof v.weight   === 'number') update.weight   = Math.max(1, Math.min(1000, Math.round(v.weight)));
    if (typeof v.isActive === 'boolean') update.isActive = v.isActive;
    if (Object.keys(update).length === 0) continue;
    await db.update(schema.greetingVariants)
      .set(update)
      .where(and(
        eq(schema.greetingVariants.id, v.id),
        eq(schema.greetingVariants.botId, params.id),
      ));
  }
  return { ok: true };
});

export const DELETE = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: { ids?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : [];
  if (ids.length === 0) return jsonError(400, 'MISSING_IDS');

  const db = requireDb();
  await db.delete(schema.greetingVariants)
    .where(and(
      eq(schema.greetingVariants.botId, params.id),
      inArray(schema.greetingVariants.id, ids),
    ));
  return { ok: true };
});
