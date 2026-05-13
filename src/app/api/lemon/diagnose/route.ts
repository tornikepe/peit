// GET /api/lemon/diagnose — public health-check that surfaces *which* LS
// env vars Vercel can actually see, plus a live API ping to confirm the key
// is valid. Never reveals secret values, only presence + last-4 chars for
// the variant IDs (so you can sanity-check they match LS dashboard).
//
// Usage: curl https://peit.vercel.app/api/lemon/diagnose

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VarStatus {
  set:      boolean;
  /** Last 4 chars only — enough to verify match without leaking secret. */
  preview?: string;
  length?:  number;
}

function check(value: string | undefined): VarStatus {
  if (!value) return { set: false };
  return { set: true, preview: `…${value.slice(-4)}`, length: value.length };
}

export async function GET() {
  const env = {
    LEMONSQUEEZY_API_KEY:       check(process.env.LEMONSQUEEZY_API_KEY),
    LEMONSQUEEZY_STORE_ID:      check(process.env.LEMONSQUEEZY_STORE_ID),
    LEMONSQUEEZY_WEBHOOK_SECRET:check(process.env.LEMONSQUEEZY_WEBHOOK_SECRET),
    LEMONSQUEEZY_VARIANT_BASIC: check(process.env.LEMONSQUEEZY_VARIANT_BASIC),
    LEMONSQUEEZY_VARIANT_PRO:   check(process.env.LEMONSQUEEZY_VARIANT_PRO),
    LEMONSQUEEZY_VARIANT_ULTIMATE: check(process.env.LEMONSQUEEZY_VARIANT_ULTIMATE),
    NEXT_PUBLIC_APP_URL:        check(process.env.NEXT_PUBLIC_APP_URL),
    DATABASE_URL:               check(process.env.DATABASE_URL),
  };

  const allSet = Object.values(env).every(v => v.set);

  // Try to authenticate against LS API — confirms API key + store ID work.
  let api: { ok: boolean; status?: number; error?: string } = { ok: false };
  if (env.LEMONSQUEEZY_API_KEY.set && env.LEMONSQUEEZY_STORE_ID.set) {
    try {
      const r = await fetch(
        `https://api.lemonsqueezy.com/v1/stores/${process.env.LEMONSQUEEZY_STORE_ID}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
            Accept:        'application/vnd.api+json',
          },
          cache: 'no-store',
        },
      );
      if (r.ok) {
        api = { ok: true, status: r.status };
      } else {
        const body = await r.text().catch(() => '');
        api = { ok: false, status: r.status, error: body.slice(0, 200) };
      }
    } catch (e) {
      api = { ok: false, error: e instanceof Error ? e.message : 'fetch failed' };
    }
  }

  return NextResponse.json({
    ok:           allSet && api.ok,
    summary:      allSet ? (api.ok ? 'OK' : 'env present but LS API rejected') : 'missing env vars',
    env,
    lemonApi:     api,
    nodeEnv:      process.env.NODE_ENV,
    vercelEnv:    process.env.VERCEL_ENV ?? null,
    runtime:      'nodejs',
  });
}
