// POST /api/lemon/checkout
// Body: { plan: 'basic' | 'pro' | 'ultimate' }
// Returns: { url: string } — Lemon Squeezy-hosted checkout URL.
//
// LS handles the trial period itself (configure on the variant in dashboard).
// We pass `custom: { user_id }` so the webhook can identify the user even
// before we've stored the LS customer_id.

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  isLemonAvailable, requireLemon, getAppUrl, lsFetch, LsApiError,
  type LsDoc, type LsCheckoutAttrs,
} from '@/lib/lemon';
import { variantIdFor } from '@/lib/plan-prices';
import { getOrCreateSubscription } from '@/db/queries/subscriptions';
import type { PlanSlug } from '@/lib/plan-limits';

export const runtime = 'nodejs';

export const POST = withAuth(async ({ user, req }) => {
  // Specific missing-var diagnostics so the UI can pinpoint what's wrong.
  const missing: string[] = [];
  if (!process.env.LEMONSQUEEZY_API_KEY)  missing.push('LEMONSQUEEZY_API_KEY');
  if (!process.env.LEMONSQUEEZY_STORE_ID) missing.push('LEMONSQUEEZY_STORE_ID');
  if (missing.length) {
    console.error('[lemon/checkout] missing env:', missing.join(', '));
    return jsonError(503, 'LEMON_NOT_CONFIGURED',
      `Missing env vars on the server: ${missing.join(', ')}`);
  }
  if (!isLemonAvailable()) return jsonError(503, 'LEMON_NOT_CONFIGURED');

  let body: { plan?: string };
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  const plan = body.plan as PlanSlug;
  if (!plan || !['basic', 'pro', 'ultimate'].includes(plan)) {
    return jsonError(400, 'INVALID_PLAN');
  }

  const variantId = variantIdFor(plan);
  if (!variantId) {
    console.error('[lemon/checkout] variant missing for plan:', plan);
    return jsonError(503, 'VARIANT_NOT_CONFIGURED',
      `Set LEMONSQUEEZY_VARIANT_${plan.toUpperCase()} on the server`);
  }

  // Ensure the user has a local subscription row (creates a trial on first call).
  await getOrCreateSubscription(user.id);

  const { storeId } = requireLemon();
  const appUrl = getAppUrl(req);

  try {
    const checkout = await lsFetch<LsDoc<LsCheckoutAttrs>>('/checkouts', {
      method: 'POST',
      body: {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              name:  user.name ?? undefined,
              // `custom` arrives back on every webhook event for this sub —
              // use it as the source of truth for userId attribution.
              custom: { user_id: user.id, plan },
            },
            product_options: {
              // Where to send the customer after a successful purchase.
              redirect_url:        `${appUrl}/dashboard?checkout=success&plan=${plan}`,
              receipt_button_text: 'გადადი დაშბორდზე',
              receipt_link_url:    `${appUrl}/dashboard`,
              receipt_thank_you_note:
                'მადლობა! შენი ბოტი მზადაა — დაშბორდიდან შეგიძლია მართო.',
            },
            checkout_options: {
              embed:        false,
              media:        false,
              dark:         true,
              // Disable test card warnings in test mode — they look spammy.
              button_color: '#14b8a6',
            },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      },
    });

    const url = checkout?.data?.attributes?.url;
    if (!url) return jsonError(500, 'NO_CHECKOUT_URL');
    return { url };
  } catch (e) {
    if (e instanceof LsApiError) {
      console.error('[lemon/checkout]', e.status, e.body);
      return jsonError(502, 'LEMON_API_ERROR', e.body);
    }
    throw e;
  }
});
