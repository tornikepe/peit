# Architecture

## Overview

Peit is a single Next.js 16 app that serves three audiences from one codebase:

1. **Visitors** → the marketing landing (`/`).
2. **Customers** → the authenticated dashboard (`/dashboard/**`).
3. **End‑users** → the embeddable chat widget (`/widget/[id]`) and the channel
   webhooks (Telegram / Meta).

```
                         ┌──────────────────────────┐
   Visitor ─────────────▶│  Landing  (/)            │
                         └──────────────────────────┘
                         ┌──────────────────────────┐   Clerk
   Customer ───auth────▶ │  Dashboard (/dashboard)  │◀──────────
                         └────────────┬─────────────┘
                                      │ Drizzle
                                      ▼
                         ┌──────────────────────────┐
                         │     Neon Postgres        │
                         └────────────┬─────────────┘
                                      ▲
   End‑user ─▶ Widget / Telegram / Meta webhook ─▶ /api/widget|channels
                                      │
                                      ▼
                         LLM (Claude Haiku → Gemini)  +  Vercel Blob
```

## Request → answer flow (the core loop)

1. End‑user sends a message to `POST /api/widget/[id]/stream` (SSE) — or via a
   channel webhook (`/api/channels/telegram/...`, `/api/channels/meta/webhook`).
2. The route loads the bot, rate‑limits by IP (`rate_limits` table), and
   sanitizes any attachments (`src/lib/chat-attachments.ts`).
3. **Retrieval:** relevant `knowledge_chunks` + `faqs` are selected for context
   (RAG). FAQs can short‑circuit to a canned answer; attachments force the AI
   path.
4. **Attachments:** private blobs are re‑read server‑side → images become base64
   for Claude vision, documents are text‑extracted (`pdf-parse` / `mammoth`).
5. **Generation:** `src/lib/llm.ts` calls Claude Haiku (`src/lib/claude.ts`); on
   failure it falls back to Gemini. The answer streams back as SSE.
6. **Persistence:** the user message (+ attachments) and the bot reply are stored
   in `messages`; a `conversation` row groups them. Sentiment is classified
   best‑effort.
7. **Side effects:** detected leads are written to `leads`; "hot lead" emails are
   sent via Resend; analytics aggregate from these tables.

## Data model (`src/db/schema.ts`)

| Table | Holds |
|-------|-------|
| `users` | Clerk user mirror + plan/trial fields |
| `bots` | One chatbot: name, brand color, system prompt, settings |
| `faqs` | Curated Q→A pairs per bot |
| `knowledge_chunks` | Crawled/uploaded content chunks for RAG retrieval |
| `conversations` | A chat session (channel, language, geo, tags, handoff) |
| `messages` | Individual turns; `attachments` jsonb; `source`, `sentiment`, `feedback` |
| `flows` | Scripted conversation flows |
| `greeting_variants` | A/B‑tested opening messages |
| `leads` | Captured contacts from conversations |
| `subscriptions` | Lemon Squeezy plan state |
| `rate_limits` | Per‑IP throttling |
| `team_members` | Multi‑seat access to an account |
| `api_keys` | Programmatic access tokens |
| `bot_channels` | Telegram / Meta connection state per bot |

## Key libraries (`src/lib`)

| File | Responsibility |
|------|----------------|
| `llm.ts` | Provider orchestration: Claude → Gemini fallback |
| `claude.ts` | Builds Anthropic messages (text + vision image blocks), streams |
| `chat-attachments.ts` | Validate client refs, re‑read private blobs, base64/extract |
| `document-extract.ts` | PDF/DOCX → text |
| `clerk-appearance.ts` | Brand accent for Clerk; dark theme enforced in `globals.css` |
| `bots.ts` | Bot loading / config helpers |

## Auth

Clerk gates `/dashboard/**` and all authenticated `/api` routes (via a
`withAuth` helper). The widget and channel webhooks are **public** but
rate‑limited and scoped to a bot id. Locally the app runs in Clerk keyless mode
when only development keys are present.

## Storage

Uploads (chat attachments, knowledge files) go to a **private** Vercel Blob
store (`access: 'private'`). The client only ever holds a reference
(`{url, pathname, filename, mimeType, kind}`); bytes are re‑read server‑side so
the server never trusts client‑supplied content.

## Rendering surfaces

- **Landing** is styled by `src/styles/midnight.css` scoped under `.ms-root`.
- **Dashboard** uses Tailwind, with a global blue remap + Clerk dark overrides
  in `src/app/globals.css`. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
