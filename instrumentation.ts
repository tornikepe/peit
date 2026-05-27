// Next.js 14+ instrumentation hook — loaded once per runtime by the
// framework. We use it to register the right Sentry config depending
// on whether the current process is the Node.js server, an edge
// runtime worker, or a browser bundle (browser is wired via
// sentry.client.config.ts through next.config's Sentry wrapper).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture request errors so server-component / API-route exceptions
// land in Sentry with full stack + request metadata. Required by
// @sentry/nextjs ≥8 — without it server errors won't auto-report.
export { captureRequestError as onRequestError } from '@sentry/nextjs';
