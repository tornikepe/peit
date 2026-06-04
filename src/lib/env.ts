// Centralized, typed environment access + validation.
//
// IMPORTANT — graceful degradation is a core design choice in this codebase:
// the app boots without a DB, without an LLM key, without billing, etc., and
// each feature degrades cleanly. So `env.ts` does NOT hard-crash at import on
// a missing var (that would break local dev and partial deploys). Instead it:
//   - exposes typed, trimmed accessors via `env`
//   - offers `validateEnv()` to log a clear report of what's missing
//   - offers `assertRequired()` for callers that genuinely cannot proceed
//
// New code should read from `env` rather than `process.env` directly.

import { z } from 'zod';

const raw = z.object({
  NODE_ENV:               z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_ENV:        z.enum(['development', 'staging', 'production']).optional(),
  NEXT_PUBLIC_APP_URL:    z.string().url().optional(),

  // Data / auth
  DATABASE_URL:           z.string().min(1).optional(),
  CLERK_SECRET_KEY:       z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // LLM (at least one recommended)
  ANTHROPIC_API_KEY:      z.string().min(1).optional(),
  GEMINI_API_KEY:         z.string().min(1).optional(),
  VOYAGE_API_KEY:         z.string().min(1).optional(),

  // Storage / email / billing
  BLOB_READ_WRITE_TOKEN:  z.string().min(1).optional(),
  RESEND_API_KEY:         z.string().min(1).optional(),
  LEMONSQUEEZY_API_KEY:   z.string().min(1).optional(),
  LEMONSQUEEZY_STORE_ID:  z.string().min(1).optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Ops
  CRON_SECRET:            z.string().min(1).optional(),
  LOGTAIL_SOURCE_TOKEN:   z.string().min(1).optional(),
  ADMIN_EMAILS:           z.string().optional(),
}).passthrough();

export type Env = z.infer<typeof raw>;

/** Parsed, typed view of the environment. Never throws — unknown/missing
 *  optional vars are simply undefined. */
export const env: Env = raw.parse(process.env);

/** Vars that production genuinely needs for the paid product to function. */
export const PRODUCTION_REQUIRED = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
] as const;

/**
 * Report (don't throw) which production-required vars are missing. Call this
 * from a startup/preflight path to get a single clear log line instead of
 * scattered runtime errors. Returns the list of missing keys.
 */
export function validateEnv(): string[] {
  const missing = PRODUCTION_REQUIRED.filter(k => !process.env[k]?.trim());
  if (missing.length && env.NODE_ENV === 'production') {
    console.warn(
      `[env] missing production-required variables: ${missing.join(', ')} — ` +
      `dependent features will run in degraded mode.`,
    );
  }
  return missing;
}

/** Throw with a clear message if any of `keys` is unset. For callers that
 *  truly cannot continue (e.g. a script that must hit the DB). */
export function assertRequired(keys: (keyof Env)[]): void {
  const missing = keys.filter(k => !process.env[k as string]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/** True when running as the staging environment (drives the staging banner). */
export const isStaging = env.NEXT_PUBLIC_ENV === 'staging';
