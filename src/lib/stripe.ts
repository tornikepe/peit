// Stripe client — singleton, server-side only.
// Returns null when STRIPE_SECRET_KEY isn't configured so the rest of the
// app keeps working in trial-only mode.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[stripe] STRIPE_SECRET_KEY not set — billing disabled');
    }
    return null;
  }
  _stripe = new Stripe(key, {
    typescript: true,
    appInfo: { name: 'Peit', version: '1.0' },
  });
  return _stripe;
}

export function requireStripe(): Stripe {
  const s = getStripe();
  if (!s) throw new Error('STRIPE_NOT_CONFIGURED');
  return s;
}

export function isStripeAvailable(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * App's public URL. Used to build success_url / cancel_url for Checkout
 * and the Customer Portal return_url. Must be a fully-qualified origin
 * (Stripe rejects localhost path-only URLs).
 */
export function getAppUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (req) {
    try {
      return new URL(req.url).origin;
    } catch { /* fall through */ }
  }
  return 'http://localhost:3000';
}
