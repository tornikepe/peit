// Shared helpers for API routes — auth, error mapping, JSON responses.

import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getCurrentUserOrThrow } from '@/db/queries/users';
import type { DbUser } from '@/db/schema';

export function jsonError(status: number, code: string, message?: string) {
  return NextResponse.json({ error: code, message }, { status });
}

/**
 * Wrap a route handler so all the boilerplate (auth check, DB check,
 * exception → JSON) lives in one place.
 *
 *   export const GET = withAuth(async ({ user }) => { ... });
 */
export function withAuth<T>(
  handler: (ctx: { user: DbUser; req: Request }) => Promise<T> | T,
) {
  return async (req: Request): Promise<Response> => {
    if (!getDb()) return jsonError(503, 'DB_NOT_CONFIGURED', 'DATABASE_URL is not set');

    let user: DbUser;
    try {
      user = await getCurrentUserOrThrow();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized';
      if (msg === 'UNAUTHORIZED') return jsonError(401, 'UNAUTHORIZED');
      if (msg === 'DATABASE_NOT_CONFIGURED') return jsonError(503, 'DB_NOT_CONFIGURED');
      return jsonError(500, 'AUTH_ERROR', msg);
    }

    try {
      const result = await handler({ user, req });
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (e) {
      console.error('[api]', e);
      const msg = e instanceof Error ? e.message : 'Internal error';
      return jsonError(500, 'INTERNAL', msg);
    }
  };
}
