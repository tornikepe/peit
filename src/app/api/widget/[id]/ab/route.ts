// POST /api/widget/[id]/ab — public, CORS-enabled.
// Records an impression or conversion against a greeting variant. Body:
//   { variantId: string, event: 'impression' | 'conversion' }
//
// Visitors are anonymous so we accept any vote bound to a variant that
// belongs to this bot, rate-limit per IP, and use UPDATE … = … + 1 so
// concurrent calls don't fight.

import { and, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function OPTIONS() { return corsPreflight(); }

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const { id: botId } = await params;
  if (!botId) return corsError(400, 'MISSING_BOT_ID');

  const ip = getClientIp(req);
  const rl = await checkRateLimit(rateLimitKey(['ab', ip]), 120, 600);
  if (!rl.allowed) return corsError(429, 'RATE_LIMITED');

  let body: { variantId?: string; event?: string };
  try { body = await req.json(); }
  catch { return corsError(400, 'INVALID_JSON'); }

  const variantId = typeof body.variantId === 'string' ? body.variantId : '';
  const event     = body.event;
  if (!variantId) return corsError(400, 'MISSING_VARIANT_ID');
  if (event !== 'impression' && event !== 'conversion') {
    return corsError(400, 'INVALID_EVENT');
  }

  const col = event === 'impression'
    ? schema.greetingVariants.impressions
    : schema.greetingVariants.conversions;

  const res = await db.update(schema.greetingVariants)
    .set({ [event === 'impression' ? 'impressions' : 'conversions']: sql`${col} + 1` })
    .where(and(
      eq(schema.greetingVariants.id, variantId),
      eq(schema.greetingVariants.botId, botId),
    ))
    .returning({ id: schema.greetingVariants.id });

  if (res.length === 0) return corsError(404, 'VARIANT_NOT_FOUND');
  return corsJson({ ok: true });
}
