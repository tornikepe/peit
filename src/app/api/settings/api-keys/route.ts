// GET  /api/settings/api-keys → list owner-scoped keys (no secrets)
// POST /api/settings/api-keys → generate a new key; raw secret shown ONCE
//
// Spec uses the Stripe-style "shown once, hashed at rest" pattern. We
// SHA-256 the raw key in lib/api-key.ts (192 bits of entropy → bcrypt
// adds no real value at that scale and would slow every future verify).

import { withAuth, jsonError } from '@/app/api/_helpers';
import { listApiKeys, insertApiKey } from '@/db/queries/api-keys';
import { generateApiKey } from '@/lib/api-key';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => {
  const keys = await listApiKeys(user.id);
  return {
    keys: keys.map(k => ({
      id:         k.id,
      name:       k.name,
      prefix:     k.prefix,
      createdAt:  k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      revokedAt:  k.revokedAt?.toISOString()  ?? null,
    })),
  };
});

export const POST = withAuth(async ({ user, req }) => {
  let body: { name?: unknown };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!name) return jsonError(400, 'INVALID_NAME', 'name is required');

  const { raw, prefix, hash } = generateApiKey();
  const row = await insertApiKey(user.id, name, prefix, hash);

  // Raw key returned ONCE in the body. The UI must surface it to the
  // user immediately (copy-to-clipboard modal); after this response we
  // can never reconstruct it.
  return {
    ok: true,
    key: {
      id:        row.id,
      name,
      prefix:    row.prefix,
      rawKey:    raw,
    },
  };
});
