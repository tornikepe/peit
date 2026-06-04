// POST /api/referral/apply — validate a referral code at checkout time.
// Requires auth (the checkout flow is authenticated). Sets the attribution
// cookie so provisioning/first-payment can credit the referrer, and returns
// the discount the referred user will get. Rate-limited per user.

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { requireDb, schema } from '@/db';
import {
  REFERRAL_COOKIE, REFERRED_DISCOUNT_PERCENT, resolveReferrer,
} from '@/lib/referral';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const Body = z.object({ code: z.string().min(2).max(40) });

export const POST = withAuth(async ({ user, req }) => {
  const rl = await checkRateLimit(`referral-apply:${user.id}`, 20, 3600);
  if (!rl.allowed) return jsonError(429, 'RATE_LIMITED', 'Too many attempts, try later.');

  let json: unknown;
  try { json = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const parsed = Body.safeParse(json);
  if (!parsed.success) return jsonError(400, 'INVALID_CODE', 'A referral code is required.');

  const referrerId = await resolveReferrer(parsed.data.code, user.id);
  if (!referrerId) return jsonError(404, 'CODE_NOT_FOUND', 'This referral code is invalid.');

  const db = requireDb();
  const referrer = await db.query.users.findFirst({
    where: eq(schema.users.id, referrerId),
    columns: { name: true },
  });

  const res = NextResponse.json({
    ok: true,
    referrerName: referrer?.name ?? 'a Peit user',
    discountPercent: REFERRED_DISCOUNT_PERCENT,
  });
  res.cookies.set(REFERRAL_COOKIE, parsed.data.code.trim().toLowerCase(), {
    httpOnly: true, sameSite: 'lax', secure: true, path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
});
