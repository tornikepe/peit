# API Reference

All routes live under `src/app/api/**/route.ts` and run on the Node.js runtime.

**Auth model**
- 🔒 **Authenticated** routes require a Clerk session (or API key) — enforced by
  a `withAuth` helper; they 404/401 if the caller doesn't own the resource.
- 🌐 **Public** routes (widget + channel webhooks) are unauthenticated but
  rate‑limited by IP and scoped to a bot id.

Errors share a shape: `{ error: { code, message? } }` with an appropriate HTTP
status (`400 INVALID_JSON`, `404 NOT_FOUND`, `429` rate‑limited, `503` when
`DATABASE_URL` is unset).

---

## Widget (🌐 public)

| Method · Route | Purpose |
|----------------|---------|
| `POST /api/widget/[id]/stream` | Main chat endpoint. **SSE** stream of the answer. Body: `{ text, lang, attachments? }`. Empty `text` allowed if attachments present. Persists user + bot messages. |
| `POST /api/widget/[id]/upload` | Multipart file upload → private Vercel Blob. Validates type (jpg/jpeg/png/gif/webp/pdf/docx) and ≤10 MB. Returns `{ ok, attachment:{url,pathname,filename,mimeType,kind} }`. |
| `POST /api/widget/[id]/message` | Non‑streaming message variant. |
| `GET  /api/widget/[id]/config` | Public bot config for the widget (theme, greeting, etc.). |
| `POST /api/widget/[id]/lead` | Capture a lead from the conversation. |
| `POST /api/widget/[id]/feedback` | Thumbs up/down on a bot message. |
| `GET  /api/widget/[id]/ab` | Returns the A/B greeting variant to show. |

### `POST /api/widget/[id]/stream`
```jsonc
// request
{ "text": "გაქვთ მაგიდა 4 კაცზე?", "lang": "ka",
  "attachments": [ { "url": "...", "pathname": "chat/<id>/<file>",
                     "filename": "menu.png", "mimeType": "image/png", "kind": "image" } ] }
// response: text/event-stream — incremental answer chunks
```

---

## Conversations (🔒)

| Method · Route | Purpose |
|----------------|---------|
| `GET  /api/conversations` | List conversations (filter by `botId`, channel, tag). |
| `GET  /api/conversations/[id]` | Full transcript: messages with `attachments`, `feedback`, `sentiment`, `source`. |
| `PATCH /api/conversations/[id]` | Update `tags` / `isHandedOff`. |
| `GET  /api/conversations/[id]/export` | Export a transcript. |

---

## Bots & knowledge (🔒)

| Method · Route | Purpose |
|----------------|---------|
| `GET/POST /api/bots` · `GET/PATCH/DELETE /api/bots/[id]` | CRUD bots. |
| `POST /api/bots/[id]/recrawl` / `reindex` | Re‑crawl the site / rebuild the RAG index. |
| `POST /api/bots/[id]/knowledge/uploads` | Upload knowledge docs (→ chunks). |
| `GET/POST /api/bots/[id]/flows` | Conversation flows. |
| `GET/POST /api/bots/[id]/variants` | Greeting A/B variants. |
| `POST /api/analyze-site` | Analyze a URL before bot creation. |

## Channels (🔒 admin + 🌐 webhooks)

| Method · Route | Purpose |
|----------------|---------|
| `GET/POST /api/channels/[botId]` | Channel state for a bot. |
| `POST /api/channels/[botId]/telegram` | Connect a Telegram bot. |
| `GET  /api/channels/telegram/webhook/[secret]` 🌐 | Telegram inbound webhook. |
| `*    /api/channels/[botId]/meta*` | Instagram/Messenger connect + tokens. |
| `GET/POST /api/channels/meta/webhook` 🌐 | Meta verify + inbound webhook (uses `META_WEBHOOK_VERIFY_TOKEN`). |

## Leads (🔒)

| `GET /api/leads` · `GET/PATCH/DELETE /api/leads/[id]` · `GET /api/leads/export` | Manage and export captured leads. |

## Billing — Lemon Squeezy (🔒 + 🌐 webhook)

| Method · Route | Purpose |
|----------------|---------|
| `POST /api/lemon/checkout` | Start a checkout. |
| `GET  /api/lemon/portal` | Customer billing portal link. |
| `GET  /api/subscription` | Current plan/usage. |
| `POST /api/webhooks/lemon` 🌐 | Subscription lifecycle webhook (signature‑verified). |

## Account & settings (🔒)

| Route | Purpose |
|-------|---------|
| `/api/me`, `/api/me/export`, `/api/me/delete`, `/api/me/email-preferences` | Profile + GDPR export/delete + email prefs. |
| `/api/settings/profile|notifications|billing` | Settings persistence. |
| `/api/settings/api-keys[/id]` | API key CRUD. |
| `/api/settings/team[/id]`, `/api/settings/team/invite` | Team seats. |
| `/api/unsubscribe` 🌐 | One‑click email unsubscribe. |

## Analytics & feedback (🔒)

| `GET /api/analytics/export` · `GET /api/feedback/negatives` | Analytics export + negative‑feedback list. |

## Ops (🌐 internal)

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Health check. |
| `POST /api/admin/migrate`, `/api/bots/migrate` | Migration helpers. |
| `GET /api/cron/resync`, `/api/cron/trial-reminders` | Scheduled jobs (reindex, trial emails). |
