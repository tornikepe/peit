<div align="center">

# Peit

**AI chatbot SaaS for Georgian small & medium businesses.**
Answers visitor questions in Georgian, English and Russian, 24 / 7,
on website widgets, Telegram, Instagram and Facebook Messenger —
captures every lead while you sleep.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftornikepe%2Fpeit)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live site](https://peit.ge) · [Pricing](https://peit.ge/pricing) · [Docs](#getting-started)

</div>

---

## What is Peit?

Peit is a multi-tenant SaaS that lets a Georgian business stand up a
production-ready AI assistant in **under 10 minutes**: paste a website URL,
the platform crawls and chunks it, embeds the content with Voyage AI,
and serves answers grounded in that knowledge base via Claude Haiku 4.5.

End customers get an embeddable chat widget for their own site. The owner
gets a dashboard with conversation analytics, a Kanban-style lead inbox
(cold / warm / hot scoring), a CSV exporter, a Lemon-Squeezy-backed
billing portal, and full GDPR self-service (data export + account
deletion).

## Feature highlights

| Area | What's inside |
| --- | --- |
| **Retrieval-augmented AI** | Voyage `voyage-3` embeddings (1024 dim) → pgvector HNSW search → Claude Haiku 4.5 with prompt caching + SSE streaming. Token usage metered per subscription. |
| **Multi-channel widget** | Shadow-DOM IIFE loader at `/widget.js`, allowlist-based origin enforcement, per-IP / per-bot / per-visitor rate limiting on every public endpoint. |
| **Lead capture** | GDPR-compliant collection (explicit consent + audit trail), rule-based scoring (`cold` / `warm` / `hot`), strict email validation, dashboard with filters / search / CSV export. |
| **Payments** | Lemon Squeezy as Merchant of Record (handles global VAT). HMAC-verified webhooks drive plan changes, period rollover, dunning. Auto-resume checkout after sign-up. |
| **Email** | Resend transactional pipeline with welcome / lead-alert / trial-ending / trial-ended / receipt / cancelled / payment-failed templates, all in KA / EN / RU, HMAC-signed one-click unsubscribe per RFC 8058. |
| **Legal & GDPR** | `/terms`, `/privacy`, `/gdpr` (DPA), `/cookies` rendered from a single i18n-backed component. Granular cookie consent banner. `GET /api/me/export` for Art. 15+20, `POST /api/me/delete` for Art. 17 (Clerk + DB cascade). |
| **Observability** | `/api/health` liveness + readiness, daily Vercel cron at 09:00 UTC for trial reminders. |
| **i18n** | Full Georgian-first localisation with English & Russian throughout the marketing site, dashboard, widget, and every email template. |
| **SEO** | Dynamic sitemap & robots, OG tags & JSON-LD schema for `Organization` + `SoftwareApplication`, 8 statically-generated industry landing pages, 3 competitor-alternative pages. |

## Tech stack

- **Next.js 16** (App Router, Server Components, dynamic + static routes)
- **TypeScript 5** strict mode
- **Tailwind CSS v4** + Lucide icons
- **Clerk** for auth (email / Google OAuth, password reset, session management)
- **Drizzle ORM** on Postgres (Neon / Supabase) with the `vector` extension
- **Anthropic Claude Haiku 4.5** for grounded answer generation
- **Voyage AI** for document + query embeddings
- **Lemon Squeezy** as Merchant of Record for billing
- **Resend** for transactional email
- **Vercel** for hosting + cron + edge runtime

## Repository layout

```
peit/
├── drizzle/                          # SQL migrations (sequential, applied via db:init)
├── public/                           # Static assets, favicons, OG image
├── scripts/                          # One-shot CLIs (db init, migration helpers)
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   ├── bots/                 # Bot CRUD (+ migrate localStorage → cloud)
│   │   │   ├── cron/                 # Vercel-cron-protected jobs
│   │   │   │   └── trial-reminders/  # Daily trial-ending + trial-ended emails
│   │   │   ├── health/               # Liveness + readiness probe
│   │   │   ├── leads/                # Lead listing, status update, CSV export
│   │   │   ├── lemon/                # Checkout + customer-portal
│   │   │   ├── me/                   # Profile, email-preferences, export, delete
│   │   │   ├── unsubscribe/          # HMAC one-click email opt-out
│   │   │   ├── webhooks/lemon/       # Lemon Squeezy event sink
│   │   │   └── widget/[id]/          # Public widget endpoints (config / message / stream / lead)
│   │   ├── dashboard/                # Authed user surface (bots, leads, billing, privacy)
│   │   ├── industries/[slug]/        # 8 SEO landing pages
│   │   ├── alternatives/[slug]/      # vs-competitor comparison pages
│   │   ├── (legal)                   # /terms, /privacy, /gdpr, /cookies
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   ├── sitemap.ts                # Dynamic sitemap.xml
│   │   └── widget.js/                # Public IIFE loader served at /widget.js
│   ├── components/                   # UI components (Hero, ChatWidget, CookieConsent, …)
│   ├── context/                      # React contexts (Language, Bots)
│   ├── db/                           # Drizzle schema + query modules
│   ├── lib/
│   │   ├── email/                    # Resend client, layout, i18n, unsubscribe HMAC
│   │   ├── answer-engine.ts          # 4-tier retrieval (FAQ → RAG → keyword → fallback)
│   │   ├── claude.ts                 # Anthropic SDK wrapper, streaming, prompt caching
│   │   ├── embeddings.ts             # Voyage AI client
│   │   ├── lemon*.ts                 # Lemon Squeezy client + plan mapping
│   │   └── plan-limits.ts            # Single source of truth for tier limits
│   └── middleware.ts                 # Clerk auth + CSP frame-ancestors for widget pages
├── .env.example                      # Documented env var template
├── vercel.json                       # Vercel cron schedule
└── drizzle.config.ts                 # Drizzle Kit config (db push / generate / migrate)
```

## Getting started

### Prerequisites

- Node.js 20+
- A Postgres database with the `vector` extension. Easiest: a free
  [Neon](https://neon.tech) project, which ships pgvector ready-to-use.
- A [Clerk](https://clerk.com) project (free tier is enough for development).

### Local install

```bash
git clone https://github.com/tornikepe/peit.git
cd peit
cp .env.example .env.local
npm install
npm run db:init      # applies all migrations from ./drizzle to DATABASE_URL
npm run dev
```

Open <http://localhost:3000>.

`.env.example` documents every variable — only Clerk + Postgres are strictly
required to boot. The AI, email and payment integrations all have graceful
fallbacks so you can develop locally without paying anyone.

### Common scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server at :3000 |
| `npm run build` | Production build (TypeScript + lint enforced) |
| `npm run lint` | ESLint on the whole `src/` tree |
| `npm run db:generate` | Diff `schema.ts` → new SQL migration file |
| `npm run db:push` | Apply `schema.ts` directly (good for dev, dangerous in prod) |
| `npm run db:init` | Apply every file in `./drizzle/*.sql` sequentially (use this in prod) |
| `npm run db:studio` | Drizzle Studio data explorer |

## Architecture deep-dives

### Answer engine (4-tier fallback)

Every visitor question runs through [`src/lib/answer-engine.ts`](src/lib/answer-engine.ts):

1. **FAQ exact match** — instant, no AI cost.
2. **RAG with Claude** — embed query → pgvector HNSW search → top-5 chunks → Claude generates grounded reply. Streams over SSE.
3. **Keyword search** — fallback when embeddings / Claude aren't configured.
4. **Static fallback message** in the bot's primary language.

Each tier degrades cleanly on missing keys (`ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`),
so a deployment without those still serves keyword answers instead of crashing.

### Embed widget

Customers paste a single `<script>` tag:

```html
<script src="https://peit.ge/widget.js" data-bot-id="..." defer></script>
```

[`src/app/widget.js/route.ts`](src/app/widget.js/route.ts) returns an IIFE
that mounts a closed Shadow DOM, fetches the bot config from
`/api/widget/<id>/config`, and renders the chat iframe pointed at
`/widget/<id>` (server-rendered, no client-side JS bundle download from the
customer's site). Each public endpoint is rate-limited per IP, per visitor,
per bot — see [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts).

### Billing & subscription lifecycle

- Checkout URL is generated server-side by `POST /api/lemon/checkout`.
- All subscription state derives from Lemon Squeezy webhooks via
  [`src/app/api/webhooks/lemon/route.ts`](src/app/api/webhooks/lemon/route.ts) —
  HMAC-verified, idempotent.
- Period rollover resets `messagesThisPeriod` and token usage counters
  atomically in [`src/db/queries/subscriptions.ts`](src/db/queries/subscriptions.ts).
- Trial flow: 7-day trial on signup → `trialing` status → reminder at
  T-3 days (cron) → `past_due` at T+0 → "trial ended" email (cron) →
  user upgrades via portal or cancellation.

### Email pipeline

[`src/lib/email/`](src/lib/email/) is the entire transactional layer:

- `send.ts` — Resend client, `escapeHtml`, RFC-8058 `List-Unsubscribe` headers.
- `layout.ts` — shared HTML wrapper (Gmail / Apple Mail / Outlook safe).
- `i18n.ts` — every string in KA / EN / RU.
- `unsubscribe.ts` — HMAC-signed stateless tokens for one-click opt-out.
- `index.ts` — 6 public senders (welcome, lead alert, trial-ending,
  trial-ended, receipt, cancelled, payment-failed).

All senders honour the recipient's per-category `EmailPrefs` and locale.
Billing emails are transactional and bypass marketing opt-out (legally must).

## Deployment

The intended host is **Vercel**. The included `vercel.json` already declares
the daily trial-reminder cron. Set every variable from `.env.example` in
the Vercel project, then connect the repo — every push to `master` deploys
to production.

### Production launch checklist

- [ ] Provision Postgres (Neon recommended) with the `vector` extension enabled.
- [ ] Run `npm run db:init` against the production `DATABASE_URL`.
- [ ] Create a Clerk **Production** instance (separate from dev) and copy
      the `pk_live_…` / `sk_live_…` keys into Vercel.
- [ ] Set `NEXT_PUBLIC_APP_URL` to your live domain (e.g. `https://peit.ge`).
- [ ] Lemon Squeezy: create the product, copy each variant ID into
      `LEMONSQUEEZY_VARIANT_BASIC|PRO|ULTIMATE`, point the webhook at
      `/api/webhooks/lemon` with the same secret as `LEMONSQUEEZY_WEBHOOK_SECRET`.
- [ ] Resend: verify your sending domain, set `RESEND_API_KEY` and
      `RESEND_FROM=Peit Team <hi@peit.ge>`.
- [ ] Generate a long random `UNSUBSCRIBE_SECRET` and `CRON_SECRET`.
- [ ] Configure Vercel cron in the project settings (the schedule lives
      in `vercel.json` and applies automatically — but cron must be
      enabled on your Vercel plan).
- [ ] Point an uptime monitor at `https://your-domain/api/health`.

### Optional but recommended

- Wire Sentry to capture unhandled exceptions (`SENTRY_DSN`).
- Point Vercel Analytics or PostHog at the site for funnel analysis.
- Generate a Vercel-friendly OG image (`public/og-image.png`, 1200×630).
- Set up Cloudflare in front of Vercel for DDoS protection if you expect
  large bursts.

## Security & compliance

- **GDPR Art. 15 & 20** — `GET /api/me/export` streams a JSON dump of every
  row we hold for the authenticated user (bots, FAQs, chunks, conversations,
  messages, leads, subscription). Vector embeddings are intentionally
  omitted (they're derivative).
- **GDPR Art. 17** — `POST /api/me/delete` deletes the Clerk user then
  cascade-deletes the local row, taking every owned object with it.
  Confirmation gate (`{ "confirm": "DELETE" }`) protects against CSRF.
- **GDPR Art. 7 (consent)** — Cookie banner with granular categories
  (necessary / functional / analytics), persisted in `localStorage`.
- **DPA** — Public Data Processing Agreement at `/gdpr` listing every
  sub-processor (Clerk, Vercel, Lemon Squeezy, Anthropic, Voyage, Resend,
  Postgres host) and the SCC basis for international transfers.
- **Webhook integrity** — Lemon Squeezy events verified via
  `crypto.timingSafeEqual` on HMAC-SHA256 of the raw body.
- **Rate limiting** — atomic UPSERT counter
  ([`src/lib/rate-limit.ts`](src/lib/rate-limit.ts))
  across per-IP, per-bot, per-visitor windows on every public endpoint.

## Contributing

This is a closed-source SaaS at the moment, but PRs that fix bugs or
improve docs are welcome. Please run `npm run lint && npm run build`
before opening a PR — CI rejects anything that fails either check.

## License

[MIT](LICENSE) — see the LICENSE file for details.

---

<sub>Made in Tbilisi 🇬🇪 — questions? <a href="mailto:info@peit.ge">info@peit.ge</a></sub>
