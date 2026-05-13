// GET /api/lemon/diagnose — public health-check that surfaces *which* LS
// env vars Vercel can actually see, plus a live API ping to confirm the key
// is valid, plus the list of variants in the store so we can verify the
// env variant IDs match real LS variants. Never reveals secret values, only
// last-4 chars where useful for matching.
//
// Usage: curl https://peit.vercel.app/api/lemon/diagnose

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VarStatus {
  set:      boolean;
  preview?: string;
  length?:  number;
}

function check(value: string | undefined): VarStatus {
  if (!value) return { set: false };
  return { set: true, preview: `…${value.slice(-4)}`, length: value.length };
}

async function lsGet<T>(path: string): Promise<{ ok: boolean; status?: number; body?: T; error?: string }> {
  try {
    const r = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        Accept:        'application/vnd.api+json',
      },
      cache: 'no-store',
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return { ok: false, status: r.status, error: txt.slice(0, 500) };
    }
    return { ok: true, status: r.status, body: await r.json() as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fetch failed' };
  }
}

interface LsVariantsResponse {
  data: Array<{
    id: string;
    attributes: {
      product_id: number;
      name:       string;
      status:     string;
      price:      number;
      interval?:  string;
    };
  }>;
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

  if (!env.LEMONSQUEEZY_API_KEY.set || !env.LEMONSQUEEZY_STORE_ID.set) {
    return NextResponse.json({
      ok: false, summary: 'missing env vars', env,
    });
  }

  // 1. Verify the store is reachable with this API key.
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const store = await lsGet<{ data: { id: string; attributes: { name: string; slug: string } } }>(
    `/stores/${storeId}`,
  );

  // 2. List variants in the store so we can confirm the env variant IDs match.
  const variants = await lsGet<LsVariantsResponse>(
    `/variants?filter[store_id]=${storeId}&page[size]=50`,
  );

  // 3. Check each configured variant ID against the LS list.
  const envVariants = {
    basic:    process.env.LEMONSQUEEZY_VARIANT_BASIC,
    pro:      process.env.LEMONSQUEEZY_VARIANT_PRO,
    ultimate: process.env.LEMONSQUEEZY_VARIANT_ULTIMATE,
  };

  const variantList = variants.body?.data ?? [];
  const variantCheck = Object.entries(envVariants).map(([plan, id]) => {
    const found = id ? variantList.find(v => v.id === id) : undefined;
    return {
      plan,
      envId:        id,
      foundInStore: !!found,
      name:         found?.attributes.name,
      status:       found?.attributes.status,
      priceCents:   found?.attributes.price,
      interval:     found?.attributes.interval,
    };
  });

  const allVariantsValid = variantCheck.every(v => v.foundInStore && v.status === 'published');

  return NextResponse.json({
    ok:        allSet && store.ok && variants.ok && allVariantsValid,
    summary:   !allSet                ? 'missing env vars'
              : !store.ok            ? 'store unreachable (check API key + STORE_ID)'
              : !variants.ok         ? 'variants list failed'
              : !allVariantsValid    ? 'one or more env variant IDs do not match published LS variants'
              : 'OK',
    env,
    store: {
      ok:     store.ok,
      status: store.status,
      name:   store.body?.data?.attributes?.name,
      slug:   store.body?.data?.attributes?.slug,
      error:  store.error,
    },
    variantsInLs: variantList.map(v => ({
      id:    v.id,
      name:  v.attributes.name,
      status:v.attributes.status,
      price: v.attributes.price,
    })),
    envVariantCheck: variantCheck,
    nodeEnv:   process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
