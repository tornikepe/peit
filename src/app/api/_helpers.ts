// Shared helpers for API routes — auth, params, error handling.

import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getCurrentUserOrThrow } from '@/db/queries/users';
import type { DbUser } from '@/db/schema';

export function jsonError(status: number, code: string, message?: string) {
  return NextResponse.json({ error: code, message }, { status });
}

export type RouteParams = Record<string, string>;

interface RouteCtx<P extends RouteParams> {
  params: Promise<P>;
}

interface HandlerCtx<P extends RouteParams> {
  user:   DbUser;
  req:    Request;
  params: P;
}

/**
 * Wrap a route handler with: DB-availability check, Clerk auth +
 * lazy-provisioning, route params resolution (Next.js 16 promise form),
 * and exception → JSON mapping. All in one place.
 *
 *   export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
 *     const ok = await deleteBotForUser(user.id, params.id);
 *     if (!ok) return jsonError(404, 'NOT_FOUND');
 *     return { ok: true };
 *   });
 */
export function withAuth<
  P extends RouteParams = RouteParams,
  T = unknown,
>(
  handler: (ctx: HandlerCtx<P>) => Promise<T> | T,
) {
  return async (req: Request, ctx?: RouteCtx<P>): Promise<Response> => {
    if (!getDb()) return jsonError(503, 'DB_NOT_CONFIGURED', 'DATABASE_URL is not set');

    let user: DbUser;
    try {
      user = await getCurrentUserOrThrow();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized';
      if (msg === 'UNAUTHORIZED')           return jsonError(401, 'UNAUTHORIZED');
      if (msg === 'DATABASE_NOT_CONFIGURED') return jsonError(503, 'DB_NOT_CONFIGURED');
      return jsonError(500, 'AUTH_ERROR', msg);
    }

    let params = {} as P;
    try {
      if (ctx?.params) params = await ctx.params;
    } catch (e) {
      console.error('[api] params resolution failed:', e);
    }

    try {
      const result = await handler({ user, req, params });
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (e) {
      console.error('[api] handler error:', e);
      const msg = e instanceof Error ? e.message : 'Internal error';
      return jsonError(500, 'INTERNAL', msg);
    }
  };
}
