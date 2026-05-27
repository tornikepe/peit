// Sentry Edge-runtime SDK boot config — used by middleware + edge
// API routes (/og, /widget.js). Minimal: edge runtimes don't carry
// the same Node primitives, so we keep this lean.

import * as Sentry from '@sentry/nextjs';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn:              DSN,
    tracesSampleRate: 0.05,
    environment:      process.env.NODE_ENV,
  });
}
