// API key CRUD. Storage convention lives in lib/api-key.ts; queries here
// are the per-user gate that prevents one tenant from listing / revoking
// another's keys.

import { and, eq, isNull } from 'drizzle-orm';
import { requireDb, schema } from '@/db';
import type { DbApiKey } from '@/db/schema';

export interface PublicApiKey {
  id:         string;
  name:       string;
  prefix:     string;
  createdAt:  Date;
  lastUsedAt: Date | null;
  revokedAt:  Date | null;
}

/** Owner-scoped listing. Never includes the hash — UI consumes the prefix. */
export async function listApiKeys(userId: string): Promise<PublicApiKey[]> {
  const db = requireDb();
  const rows = await db
    .select({
      id:         schema.apiKeys.id,
      name:       schema.apiKeys.name,
      prefix:     schema.apiKeys.prefix,
      createdAt:  schema.apiKeys.createdAt,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      revokedAt:  schema.apiKeys.revokedAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, userId));
  // Most recently created first — fresher keys are usually what the
  // operator's currently working with.
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export interface InsertedApiKey { id: string; prefix: string }

export async function insertApiKey(
  userId: string,
  name:   string,
  prefix: string,
  hash:   string,
): Promise<InsertedApiKey> {
  const db = requireDb();
  const [row] = await db
    .insert(schema.apiKeys)
    .values({ userId, name, prefix, keyHash: hash })
    .returning({ id: schema.apiKeys.id, prefix: schema.apiKeys.prefix });
  return row;
}

export async function revokeApiKey(userId: string, id: string): Promise<boolean> {
  const db = requireDb();
  const existing = await db.query.apiKeys.findFirst({
    where: and(
      eq(schema.apiKeys.id, id),
      eq(schema.apiKeys.userId, userId),
    ),
  });
  if (!existing) return false;
  // Soft-revoke so audit logs still resolve `prefix → key name`. The
  // `revokedAt` column is what the eventual public-API gate will check.
  await db
    .update(schema.apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(schema.apiKeys.id, id));
  return true;
}

/** Used by a future public-API gate; not wired yet but here so the
 *  storage-side contract is complete from day one. */
export async function findActiveApiKeyByHash(hash: string): Promise<DbApiKey | undefined> {
  const db = requireDb();
  return db.query.apiKeys.findFirst({
    where: and(
      eq(schema.apiKeys.keyHash, hash),
      isNull(schema.apiKeys.revokedAt),
    ),
  });
}
