// Sentry browser SDK boot config.
//
// Loads only when NEXT_PUBLIC_SENTRY_DSN is set so local dev (where no
// DSN is configured) keeps a no-op Sentry — preventing noisy errors in
// the console.
//
// tracesSampleRate 0.1 = 10% of page views get a performance trace.
// replaysOnErrorSampleRate 1.0 = every error captures a session replay
// so we can watch what the user did right before the bug fired.

import * as Sentry from '@sentry/nextjs';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn:                       DSN,
    tracesSampleRate:          0.1,
    replaysOnErrorSampleRate:  1.0,
    replaysSessionSampleRate:  0,    // only on error, never on healthy sessions
    environment:               process.env.NODE_ENV,
    // Trim noise: ignore well-known browser bugs + extension errors that
    // aren't actionable.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  });
}
