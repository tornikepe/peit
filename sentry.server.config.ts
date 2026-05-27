// Sentry Node.js (server) SDK boot config — used by API routes,
// server components, server actions. No replays here (no DOM to
// record); just exceptions + perf traces.

import * as Sentry from '@sentry/nextjs';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn:               DSN,
    tracesSampleRate:  0.1,
    environment:       process.env.NODE_ENV,
  });
}
