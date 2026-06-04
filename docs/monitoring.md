# Monitoring & Uptime

## Health endpoint

`GET /api/health` is the canonical probe (already implemented).

- **200** when the database answers; **503** when it's down.
- Reports optional integrations (Anthropic, Gemini, Voyage, Resend, Lemon)
  as `configured: true/false` without ever exposing secret values.
- `Cache-Control: no-store`, responds in < 5s regardless of dependency state.

```bash
curl -s https://peit.vercel.app/api/health | jq
```

```jsonc
{
  "ok": true,
  "status": "healthy",            // healthy | degraded | down
  "version": "7ab7b50",
  "uptimeMs": 12345,
  "timestamp": "2026-06-04T...",
  "checks": {
    "db":        { "ok": true, "latencyMs": 18 },
    "anthropic": { "configured": true },
    "gemini":    { "configured": true },
    "lemon":     { "configured": true }
  }
}
```

## Better Stack (Uptime) — setup

1. Create a free account at **betterstack.com** → *Uptime*.
2. **Create monitor** → URL `https://peit.vercel.app/api/health`.
3. Check frequency: **every 1 minute**; expected status **200**; request timeout 5s.
4. **Escalation / alerts:** email + (optional) a Slack webhook.
5. **Status page:** create one and (optionally) map it to `status.peit.ge`.

A link to the public status page can be added to the site footer once the page
exists.

## In-app degradation banner

`src/components/ops/StatusBanner.tsx` (mounted in the root layout) pings
`/api/health` once on load. If the response is non-200 **or** slower than 3s it
shows a localized (KA/EN/RU) "service is slow" banner. The verdict is cached in
`sessionStorage` for 60s to avoid spamming the endpoint on navigation.

## Logs

`src/lib/logger.ts` emits structured JSON to stdout (captured by Vercel) and,
when `LOGTAIL_SOURCE_TOKEN` is set and `@logtail/node` is installed, mirrors
warn/error/info to Better Stack → *Logs*. The logger never throws.
