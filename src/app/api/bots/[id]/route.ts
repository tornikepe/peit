// GET    /api/bots/[id]
// PATCH  /api/bots/[id]   — partial update (status, name, FAQs, chunks, etc.)
// DELETE /api/bots/[id]

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  getBotForUser, updateBotForUser, deleteBotForUser,
  type UpdateBotInput,
} from '@/db/queries/bots';

export const runtime = 'nodejs';

export const GET = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  const bot = await getBotForUser(user.id, params.id);
  if (!bot) return jsonError(404, 'NOT_FOUND');
  return { ok: true, bot };
});

export const PATCH = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');

  let patch: UpdateBotInput;
  try { patch = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const bot = await updateBotForUser(user.id, params.id, patch);
  if (!bot) return jsonError(404, 'NOT_FOUND');
  return { ok: true, bot };
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');
  const ok = await deleteBotForUser(user.id, params.id);
  if (!ok) {
    console.warn(`[api] DELETE /api/bots/${params.id} → not found for user ${user.id}`);
    return jsonError(404, 'NOT_FOUND');
  }
  return { ok: true };
});
