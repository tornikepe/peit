// GET /api/lemon/diagnose — public health-check that surfaces *which* LS
// env vars Vercel can actually see, plus live LS API checks: store,
// products list, variants list (per product, since variants don't filter
// by store_id), and a direct lookup of each env variant ID. Never reveals
// secret values.
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

async function lsGet<T>(path: string): Promise<{
  ok: boolean; status?: number; body?: T; error?: string;
}> {
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

interface LsProductsResponse {
  data: Array<{
    id: string;
    attributes: { name: string; slug: string; status: string; price: number };
  }>;
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

interface LsVariantDoc {
  data: {
    id: string;
    attributes: {
      product_id: number; store_id?: number;
      name: string; status: string; price: number;
    };
  };
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
  if (!env.LEMONSQUEEZY_API_KEY.set || !env.LEMONSQUEEZY_STORE_ID.set) {
    return NextResponse.json({ ok: false, summary: 'missing env vars', env });
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  // 1. Store record
  const store = await lsGet<{
    data: { id: string; attributes: { name: string; slug: string } };
  }>(`/stores/${storeId}`);

  // 2. Products in this store (use this rather than variants-by-store, which
  //    isn't a supported filter on LS).
  const products = await lsGet<LsProductsResponse>(
    `/products?filter[store_id]=${storeId}&page[size]=50`,
  );
  const productList = products.body?.data ?? [];

  // 3. Variants for each product in this store
  const variantsByProduct = await Promise.all(productList.map(async (p) => {
    const v = await lsGet<LsVariantsResponse>(
      `/variants?filter[product_id]=${p.id}&page[size]=50`,
    );
    return {
      productId:   p.id,
      productName: p.attributes.name,
      variants:    (v.body?.data ?? []).map(x => ({
        id:     x.id,
        name:   x.attributes.name,
        status: x.attributes.status,
        price:  x.attributes.price,
      })),
    };
  }));

  const allVariants = variantsByProduct.flatMap(p =>
    p.variants.map(v => ({ ...v, productId: p.productId, productName: p.productName }))
  );

  // 4. Direct lookup of each env variant ID — tells us if it exists in any
  //    LS account this API key can see, and which product it belongs to.
  const envVariants = {
    basic:    process.env.LEMONSQUEEZY_VARIANT_BASIC,
    pro:      process.env.LEMONSQUEEZY_VARIANT_PRO,
    ultimate: process.env.LEMONSQUEEZY_VARIANT_ULTIMATE,
  };
  const directChecks = await Promise.all(
    Object.entries(envVariants).map(async ([plan, id]) => {
      if (!id) return { plan, envId: id, exists: false, note: 'env var not set' };
      const r = await lsGet<LsVariantDoc>(`/variants/${id}`);
      if (!r.ok) {
        return {
          plan, envId: id, exists: false,
          status: r.status,
          note:   r.status === 404
            ? 'variant ID does not exist for this API key'
            : `LS returned ${r.status}: ${r.error?.slice(0, 120)}`,
        };
      }
      const a = r.body!.data.attributes;
      return {
        plan, envId: id, exists: true,
        productId:        String(a.product_id),
        storeIdOnVariant: a.store_id ? String(a.store_id) : null,
        belongsToOurStore:
          (a.store_id ? String(a.store_id) === storeId : null),
        variantName: a.name,
        status:      a.status,
        price:       a.price,
      };
    })
  );

  return NextResponse.json({
    ok:         true,
    env,
    store: {
      ok:     store.ok, status: store.status,
      name:   store.body?.data?.attributes?.name,
      slug:   store.body?.data?.attributes?.slug,
      error:  store.error,
    },
    productsInStore: productList.map(p => ({
      id:     p.id,
      name:   p.attributes.name,
      status: p.attributes.status,
      price:  p.attributes.price,
    })),
    variantsInStore: allVariants,
    envVariantLookup: directChecks,
    nodeEnv:   process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
