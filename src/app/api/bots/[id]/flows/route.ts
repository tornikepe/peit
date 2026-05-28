// /api/bots/[id]/flows — owner-scoped CRUD for conversation flows.
//
// GET    → list all flows for this bot (id, name, isActive, steps).
// POST   → create. Body: { name, steps?, isActive? }.
// PATCH  → bulk update. Body: Array<{ id, name?, steps?, isActive? }>.
// DELETE → remove. Body: { ids: string[] }.
//
// Step shapes are validated by sanitizeFlowSteps() so a buggy editor can't
// stick garbage into the runner. We cap at 50 steps to bound widget memory.

import { and, asc, eq, inArray } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import type { FlowStep } from '@/db/schema';

export const runtime = 'nodejs';

const MAX_STEPS = 50;
const TYPES = new Set(['message', 'input', 'button']);

function sanitizeFlowSteps(input: unknown): FlowStep[] {
  if (!Array.isArray(input)) return [];
  const out: FlowStep[] = [];
  for (const raw of input) {
    if (out.length >= MAX_STEPS) break;
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Partial<FlowStep>;
    const id   = typeof r.id === 'string' && r.id ? r.id.slice(0, 64) : '';
    const type = typeof r.type === 'string' && TYPES.has(r.type) ? r.type : '';
    const text = typeof r.text === 'string' ? r.text.slice(0, 1000) : '';
    if (!id || !type || !text) continue;
    const step: FlowStep = { id, type: type as FlowStep['type'], text };
    if (typeof r.nextStepId === 'string' && r.nextStepId) {
      step.nextStepId = r.nextStepId.slice(0, 64);
    }
    if (type === 'input' && typeof r.variable === 'string' && r.variable) {
      step.variable = r.variable.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
    }
    if (type === 'button' && Array.isArray(r.options)) {
      step.options = r.options
        .filter((o): o is { label: string; value: string; nextStepId?: string } =>
          !!o && typeof o === 'object'
          && typeof (o as { label?: unknown }).label === 'string'
          && typeof (o as { value?: unknown }).value === 'string')
        .slice(0, 8)
        .map(o => ({
          label: o.label.slice(0, 40),
          value: o.value.slice(0, 200),
          nextStepId: typeof o.nextStepId === 'string' ? o.nextStepId.slice(0, 64) : undefined,
        }));
    }
    out.push(step);
  }
  return out;
}

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
  const flows = await db.query.flows.findMany({
    where: eq(schema.flows.botId, params.id),
    orderBy: [asc(schema.flows.createdAt)],
  });
  return { ok: true, flows };
});

export const POST = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: { name?: unknown; steps?: unknown; isActive?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!name) return jsonError(400, 'INVALID_NAME');

  const db = requireDb();
  const [created] = await db.insert(schema.flows).values({
    botId:    params.id,
    name,
    steps:    sanitizeFlowSteps(body.steps),
    isActive: body.isActive === true,
  }).returning();
  return { ok: true, flow: created };
});

export const PATCH = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: Array<{ id?: unknown; name?: unknown; steps?: unknown; isActive?: unknown }>;
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }
  if (!Array.isArray(body)) return jsonError(400, 'INVALID_BODY');

  const db = requireDb();
  for (const f of body) {
    if (typeof f.id !== 'string') continue;
    const update: Record<string, unknown> = {};
    if (typeof f.name === 'string')    update.name = f.name.trim().slice(0, 120);
    if (f.steps !== undefined)          update.steps = sanitizeFlowSteps(f.steps);
    if (typeof f.isActive === 'boolean') update.isActive = f.isActive;
    if (Object.keys(update).length === 0) continue;
    await db.update(schema.flows)
      .set(update)
      .where(and(eq(schema.flows.id, f.id), eq(schema.flows.botId, params.id)));
  }
  return { ok: true };
});

export const DELETE = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  if (!await ownsBot(user.id, params.id)) return jsonError(404, 'NOT_FOUND');

  let body: { ids?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === 'string')
    : [];
  if (ids.length === 0) return jsonError(400, 'MISSING_IDS');

  const db = requireDb();
  await db.delete(schema.flows)
    .where(and(eq(schema.flows.botId, params.id), inArray(schema.flows.id, ids)));
  return { ok: true };
});
