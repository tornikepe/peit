# Features

Deep‑dives on the capabilities behind the pages. See [API.md](./API.md) for
exact endpoints and [ARCHITECTURE.md](./ARCHITECTURE.md) for the data flow.

## 1. Multilingual AI answers (RAG)

The bot answers from **the customer's own content**, not generic knowledge.

- **Ingestion:** a site crawl (`cheerio`) + uploaded docs are split into
  `knowledge_chunks`. Curated `faqs` are stored as Q→A pairs.
- **Retrieval:** on each question, relevant chunks/FAQs are selected as context.
  A close FAQ match can answer directly; otherwise the LLM composes an answer.
- **Languages:** Georgian / English / Russian, detected per message; the reply
  matches the visitor's language.
- **Providers:** Claude Haiku 4.5 is primary; Gemini 2.5 Flash is the automatic
  fallback (`src/lib/llm.ts`). If both are unavailable the bot degrades to a
  safe canned reply.

## 2. File & image upload in chat

End‑users can attach files in the widget (paperclip button).

- **Upload:** `POST /api/widget/[id]/upload` → **private** Vercel Blob. Allowed:
  `jpg/jpeg/png/gif/webp/pdf/docx`, ≤ 10 MB, IP rate‑limited.
- **Reference only:** the client keeps `{url, pathname, filename, mimeType, kind}`
  on the message; the server re‑reads bytes itself (never trusts the client).
- **Vision & extraction:** images → base64 for Claude vision; PDFs/DOCX →
  text via `pdf-parse` / `mammoth`, injected as context
  (`src/lib/chat-attachments.ts`).
- **Persistence & display:** attachments are stored on the `messages.attachments`
  jsonb column and rendered inline in the widget and in the dashboard transcript.

> Vision requires Anthropic credits; without them the bot can't "see" images.

## 3. Channels — web, Telegram, Instagram, Messenger

One bot, every channel. Web uses the embeddable widget; Telegram and Meta
connect via OAuth/token and deliver messages through webhooks
(`/api/channels/...`). Channel state lives in `bot_channels`.

## 4. Conversations & human handoff

Every chat is a `conversation` grouping `messages`. The dashboard transcript
shows source (AI/FAQ/flow), sentiment, per‑message feedback, and attachments.
A conversation can be flagged **handed off** to a human and tagged for triage.

## 5. Lead capture

The bot detects contact intent and writes `leads`. Owners get a real‑time
"hot lead" email (Resend) and can export leads as CSV.

## 6. Analytics

Aggregates from `conversations`/`messages`/`leads`: conversations over time,
conversion funnel, top questions, geography, activity heatmap, KPI cards, with a
date‑range picker and export.

## 7. Flows & greeting A/B tests

- **Flows** (`flows`): scripted multi‑step conversations for common journeys.
- **Greeting variants** (`greeting_variants`): A/B‑tested opening messages;
  `/api/widget/[id]/ab` picks which to show and results feed analytics.

## 8. Billing & plans (Lemon Squeezy)

Plans (e.g. **Pro**: 10,000 conversations/mo, 5 bots, RAG, lead dashboard,
Telegram, priority support) are managed through Lemon Squeezy checkout, a
customer portal, and a signature‑verified webhook that updates `subscriptions`.
New accounts start a **7‑day trial**; `cron/trial-reminders` emails reminders.

## 9. Team, API keys, GDPR

- **Team:** invite members to one account (`team_members`).
- **API keys:** programmatic access (`api_keys`).
- **GDPR self‑service:** export or delete all account data
  (`/dashboard/privacy`, `/api/me/export`, `/api/me/delete`).

## 10. Embeddable widget

`/widget/[id]` is a standalone, themeable chat surface a customer drops onto
their site. It reads public config from `/api/widget/[id]/config`, streams
answers over SSE, and honors the bot's brand color, greeting, and custom CSS.
