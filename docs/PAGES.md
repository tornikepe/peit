# Pages

Every route that renders UI. Auth column: 🌐 public · 🔒 requires sign‑in.

## Public

| Route | Auth | Description |
|-------|------|-------------|
| `/` | 🌐 | **Landing** (`MidnightLanding.tsx`). Sections: hero, how‑it‑works, pricing, industries, FAQ, footer. Language toggle **ka/en/ru**, dark/light theme toggle. Logged‑out header shows ghost **Sign in** + amber **Sign up**; logged‑in shows **Dashboard** + account menu. All nav links scroll to in‑page sections. |
| `/signin` | 🌐 | Clerk `SignIn` card on a branded dark page. |
| `/signup` | 🌐 | Clerk `SignUp` card; starts the 7‑day trial. |
| `/widget/[id]` | 🌐 | The **embeddable chat widget** for a given bot. Streams answers, supports file/image upload (paperclip), shows attachments inline. |
| `/industries/[slug]` | 🌐 | SEO landing per industry (restaurants, clinics, …). |
| `/alternatives/[slug]` | 🌐 | Competitor/alternative comparison landing. |
| `/privacy` `/terms` `/cookies` `/gdpr` | 🌐 | Legal pages (`LegalPage.tsx`). |

## Dashboard (🔒)

| Route | Description |
|-------|-------------|
| `/dashboard` | **Overview** — plan/usage card (bots used, conversations this month), KPI stats (messages, leads, active bots, conversion), your bots list, quick "new bot" CTA. |
| `/dashboard/bots/new` | Create a bot — name, industry, brand color, site URL to crawl. |
| `/dashboard/bots/[id]` | Bot editor — knowledge (crawl/upload/reindex), FAQs, flows, greeting variants, channels (web/Telegram/Meta), custom CSS, appearance. |
| `/dashboard/bots/[id]/playground` | Test the bot live before publishing. |
| `/dashboard/bots/[id]/meta-callback` | OAuth return for Instagram/Messenger connection. |
| `/dashboard/conversations` | **Conversations** list + transcript panel. Filters by channel/tag, search. Transcript shows messages, **file/image attachments**, sentiment, feedback; handoff toggle; export. |
| `/dashboard/leads` | Captured leads table with export (CSV). |
| `/dashboard/analytics` | Charts: conversations over time, funnel, top questions, geo, heatmap, KPI cards; date range picker; export. |
| `/dashboard/feedback` | Messages users marked negative — for tuning answers. |
| `/dashboard/billing` | Plan, usage, upgrade via Lemon Squeezy. |
| `/dashboard/privacy` | Account data: export / delete (GDPR self‑service). |

## Settings (🔒, under `/dashboard/settings`)

| Route | Description |
|-------|-------------|
| `/settings` | Settings home / nav. |
| `/settings/profile` | Name, account info (Clerk‑backed). |
| `/settings/notifications` | Email preferences (e.g. hot‑lead alerts). |
| `/settings/billing` | Subscription detail + Lemon portal link. |
| `/settings/api-keys` | Create/revoke programmatic API keys. |
| `/settings/team` | Invite/manage team members (seats). |

## Localization & theme

- **Languages:** Georgian (default), English, Russian — `LanguageContext` +
  `src/lib/landing-content.ts`. The widget answers in the visitor's language.
- **Theme:** landing supports dark/light via the moon/sun toggle; the dashboard
  is dark‑only.
