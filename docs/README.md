# Peit — Documentation

**Peit** is a Georgian‑first AI chatbot SaaS. Businesses create a bot, feed it
their content (website crawl, FAQs, uploaded docs), embed it on their site or
connect Telegram / Instagram / Messenger, and get 24/7 multilingual answers plus
lead capture and analytics — all from one dashboard.

> Marketing one‑liner: *AI ჩატბოტი ქართული ბიზნესისთვის — 7 დღე უფასოდ.*

## Docs index

| Doc | What's inside |
|-----|---------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, data flow, how the pieces connect |
| [PAGES.md](./PAGES.md) | Every page on the site, what it does |
| [API.md](./API.md) | All API routes with request/response |
| [FEATURES.md](./FEATURES.md) | Feature deep‑dives (RAG, channels, uploads, billing) |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tokens, components, Clerk theming |

## Stack at a glance

| Layer | Tech |
|-------|------|
| Framework | **Next.js 16** (App Router, RSC, Turbopack) |
| Language | TypeScript (strict) |
| DB | **Neon Postgres** via **Drizzle ORM** (`postgres` driver) |
| Auth | **Clerk** (`@clerk/nextjs`) |
| LLM | **Anthropic Claude Haiku 4.5** (vision) → **Gemini 2.5 Flash** fallback (`src/lib/llm.ts`) |
| File storage | **Vercel Blob** (private store) |
| Billing | **Lemon Squeezy** (checkout, webhooks, portal) |
| Doc parsing | `pdf-parse` (lazy), `mammoth` (docx) |
| Crawling | `cheerio` |
| Email | Resend (transactional / trial reminders) |
| Monitoring | Sentry |

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # Next.js dev server (Turbopack)
```

Minimum env vars:

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth |
| `ANTHROPIC_API_KEY` | Claude (primary LLM + vision) |
| `GEMINI_API_KEY` | Fallback LLM |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (uploads) |
| `LEMON_SQUEEZY_API_KEY` + webhook secret | Billing |
| `RESEND_API_KEY` | Email |
| `META_WEBHOOK_VERIFY_TOKEN` | Instagram/Messenger webhook |

DB schema changes: `npm run db:generate` then `npm run db:push` (or apply the
SQL in `drizzle/`).

## Repo layout

```
src/
  app/            # routes: pages + /api
  components/     # landing/, dashboard*/, settings/, conversations/, ...
  db/             # schema.ts, queries/, index.ts (Drizzle client)
  lib/            # llm.ts, claude.ts, chat-attachments.ts, clerk-appearance.ts, ...
  styles/         # midnight.css (landing design tokens)
  context/        # LanguageContext, BotsContext
docs/             # this folder
drizzle/          # SQL migrations
```

## Launch checklist (operator‑side)

These need real credentials before going live:

1. **Anthropic** credits topped up (vision + answers).
2. **Clerk production keys** (removes "Development mode" badge).
3. Real **domain** + **Resend** domain verification.
4. **Lemon Squeezy** store activated.
5. `META_WEBHOOK_VERIFY_TOKEN` for Instagram/Messenger.
