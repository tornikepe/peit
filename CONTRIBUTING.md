# Contributing to Peit

## Branching & deploys

Peit deploys from a single long-lived branch.

| Branch | Role | Deploy |
|--------|------|--------|
| `master` | Production | Auto-deploys to **https://peit.vercel.app** via Vercel's GitHub integration |
| `feature/*`, `fix/*` | Work in progress | Vercel creates a **preview** deploy per push; open a PR into `master` |

> There is intentionally **no `staging` branch** — Vercel preview deploys cover
> pre-merge testing, and production config lives in one place. If a dedicated
> staging environment is ever needed, see [docs/staging-setup.md](./docs/staging-setup.md).

### Workflow

1. Branch off `master`: `git checkout -b feature/my-change`.
2. Commit, push — a Vercel **preview** URL is generated automatically.
3. Open a PR into `master`. CI runs (see below).
4. Merge once CI is green and the preview looks right. Vercel ships to
   production on merge.

## CI

`.github/workflows/ci.yml` runs on every push to `master` and every PR:

| Step | Gate | Notes |
|------|------|-------|
| `npm run lint` | informational | pre-existing findings don't block merges yet |
| `npm run type-check` | **required** | `tsc --noEmit` |
| `npm test` | **required** | placeholder until a test runner is added |
| `npm run build` | **required** | builds without secrets (graceful degradation) |

### Recommended branch protection (configure in GitHub → Settings → Branches)

Protect `master`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass → select **CI / ci**
- ✅ Require branches to be up to date before merging

## Database changes

1. Edit `src/db/schema.ts`.
2. Add a SQL migration in `drizzle/NNNN_name.sql` (idempotent — use
   `IF NOT EXISTS` / `DO $$ … EXCEPTION WHEN duplicate_object`).
3. Apply it to the shared Neon database **before** the deploy goes live —
   otherwise relational queries reference columns that don't exist yet and
   auth/provisioning breaks. (Local and production share one `DATABASE_URL`.)

## Conventions

- TypeScript strict; avoid `any` in new code.
- New API inputs validated with **Zod**.
- Every new env var goes in `.env.example` with a comment.
- Public API routes are rate-limited (`src/lib/rate-limit.ts`).
- User-facing copy respects the active locale (KA / EN / RU).
- Read the relevant guide in `node_modules/next/dist/docs/` — this is Next.js 16,
  not the version in your training data.
