// GET    /api/bots/[id]
// PATCH  /api/bots/[id]   — partial update (status, name, FAQs, chunks, etc.)
// DELETE /api/bots/[id]

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  getBotForUser, updateBotForUser, deleteBotForUser,
  type UpdateBotInput,
} from '@/db/queries/bots';

export const runtime = 'nodejs';

function getId(req: Request): string {
  // Next.js 16 App Router: pull the id from the URL pathname
  const segments = new URL(req.url).pathname.split('/');
  // .../api/bots/<id>
  return segments[segments.indexOf('bots') + 1] ?? '';
}

export const GET = withAuth(async ({ user, req }) => {
  const id = getId(req);
  if (!id) return jsonError(400, 'MISSING_ID');
  const bot = await getBotForUser(user.id, id);
  if (!bot) return jsonError(404, 'NOT_FOUND');
  return { ok: true, bot };
});

export const PATCH = withAuth(async ({ user, req }) => {
  const id = getId(req);
  if (!id) return jsonError(400, 'MISSING_ID');

  let patch: UpdateBotInput;
  try {
    patch = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON');
  }

  const bot = await updateBotForUser(user.id, id, patch);
  if (!bot) return jsonError(404, 'NOT_FOUND');
  return { ok: true, bot };
});

export const DELETE = withAuth(async ({ user, req }) => {
  const id = getId(req);
  if (!id) return jsonError(400, 'MISSING_ID');
  const ok = await deleteBotForUser(user.id, id);
  if (!ok) return jsonError(404, 'NOT_FOUND');
  return { ok: true };
});
