# Staging environment (optional)

Peit ships from `master` and relies on **Vercel preview deploys** for pre-merge
testing — every push to a feature branch / PR gets its own URL. That covers most
needs without a separate branch.

If you later want a persistent staging environment, set it up like this — these
are **manual Vercel steps**, no code required.

## 1. Add a staging branch as a deployment target

1. Create the branch: `git branch staging master && git push -u origin staging`.
2. Vercel → **Project → Settings → Git** → add `staging` under *Deploy
   branches* (or keep "all branches" and use the branch URL).
3. Staging URL pattern: `peit-git-staging-<team>.vercel.app`.

## 2. Separate environment variables

In Vercel → **Settings → Environment Variables**, scope a **Preview** (staging)
set distinct from Production:

- A **separate database** (`DATABASE_URL`) — never point staging at prod data.
- **Lemon Squeezy test mode** keys/store id.
- A separate **Clerk** development instance.
- `NEXT_PUBLIC_ENV=staging` → enables the yellow "STAGING — not production
  data" banner (`src/components/ops/StagingBanner.tsx`).

## 3. Guardrails

- Staging must use test credentials everywhere (billing, email).
- The staging banner makes the environment unmistakable in screenshots.
- Do **not** add `staging` to the production `crons` — schedule jobs only where
  you want them to run.

> Reminder: this repo currently works **master-only** by design. Only introduce
> a staging branch if there's a real need; otherwise preview deploys suffice.
