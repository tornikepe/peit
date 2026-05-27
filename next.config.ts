// Next.js config — single file for build options, image domains, bundle
// analyzer, Sentry source-map upload. Each block is commented so the
// order of operations stays readable.

import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Bundle the SQL migration files so the /api/admin/migrate endpoint can
  // read them at runtime on Vercel. Without this Next.js prunes the folder
  // as "unused" (the import graph never references it explicitly).
  outputFileTracingIncludes: {
    '/api/admin/migrate': ['./drizzle/**/*.sql', './drizzle/meta/**/*'],
  },

  // ─── Image optimisation ────────────────────────────────────────────────
  // External hosts we need to allowlist for <Image>:
  //   img.clerk.com               — Clerk-hosted user avatars
  //   images.clerk.dev            — Clerk legacy/dev avatars
  //   lh3.googleusercontent.com   — Google OAuth profile photos
  //
  // Without this <Image src="…"> errors at request time for any external
  // URL. Modern formats (AVIF / WebP) cut image weight ~25-50% vs the
  // original JPEG/PNG with no visible quality loss.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // NOTE: tried setting `turbopack.root: path.resolve(import.meta.dirname)`
  // here to silence the local-dev "multiple lockfiles" warning, but it
  // caused MIDDLEWARE_INVOCATION_FAILED on Vercel — the resolved path
  // exists on the dev laptop but not in the serverless filesystem layout.
  // The warning was only noisy in local dev, never in production, so the
  // workaround isn't worth the risk.
};

// ─── Bundle analyzer wrapper ─────────────────────────────────────────────
// Enabled only when `ANALYZE=true` env var is set so prod deploys never
// ship the analyzer HTML inside the build artifacts.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// ─── Sentry wrapper ──────────────────────────────────────────────────────
// withSentryConfig uploads source maps during `next build` so stack
// traces in the Sentry dashboard map back to TypeScript line numbers.
// Without SENTRY_AUTH_TOKEN the wrapper is a no-op — local dev keeps
// working even when Sentry isn't configured.
export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    org:           process.env.SENTRY_ORG,
    project:       process.env.SENTRY_PROJECT,
    silent:        !process.env.CI,
    widenClientFileUpload: true,
    // tunnelRoute can be added later if Brave / uBlock starts blocking
    // direct ingest hits — undefined keeps the bundle small.
    tunnelRoute:   undefined,
    disableLogger: true,
    automaticVercelMonitors: false,
  },
);
