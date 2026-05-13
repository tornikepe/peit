// POST /api/lemon/portal
// Returns: { url: string } — LS Customer Portal URL.
// Customer can update payment method, view invoices, change/cancel sub.
//
// LS exposes a fresh signed portal URL each time the customer is fetched,
// so we always fetch live (no caching).

import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import {
  isLemonAvailable, lsFetch, LsApiError,
  type LsDoc, type LsCustomerAttrs,
} from '@/lib/lemon';

export const runtime = 'nodejs';

export const POST = withAuth(async ({ user }) => {
  if (!isLemonAvailable()) return jsonError(503, 'LEMON_NOT_CONFIGURED');

  const db = requireDb();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
    columns: { lsCustomerId: true },
  });

  if (!sub?.lsCustomerId) {
    return jsonError(404, 'NO_CUSTOMER', 'No LS customer yet — checkout first.');
  }

  try {
    const customer = await lsFetch<LsDoc<LsCustomerAttrs>>(
      `/customers/${sub.lsCustomerId}`,
    );
    const url = customer?.data?.attributes?.urls?.customer_portal;
    if (!url) return jsonError(500, 'NO_PORTAL_URL');
    return { url };
  } catch (e) {
    if (e instanceof LsApiError) {
      console.error('[lemon/portal]', e.status, e.body);
      return jsonError(502, 'LEMON_API_ERROR', e.body);
    }
    throw e;
  }
});
