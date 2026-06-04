// Public API documentation page (/docs/api). Plain, server-rendered, styled
// with Tailwind. Describes the stable widget API used by embeds & integrations.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API — Peit',
  description: 'Peit public widget API reference.',
};

interface Endpoint {
  method: string;
  path:   string;
  desc:   string;
  body?:  string;
  resp:   string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: '/api/widget/{botId}/stream',
    desc: 'Send a visitor message; streams the AI answer (SSE). Empty text is allowed when attachments are present.',
    body: `{ "text": "გაქვთ მაგიდა 4 კაცზე?", "lang": "ka",
  "attachments": [{ "url": "...", "pathname": "...",
    "filename": "menu.png", "mimeType": "image/png", "kind": "image" }] }`,
    resp: 'text/event-stream — incremental answer chunks',
  },
  {
    method: 'GET', path: '/api/widget/{botId}/config',
    desc: 'Public bot config for the widget (theme, greeting, brand color).',
    resp: `{ "name": "...", "brandColor": "#2563eb", "greeting": { "ka": "..." } }`,
  },
  {
    method: 'POST', path: '/api/widget/{botId}/lead',
    desc: 'Capture a lead from the conversation.',
    body: `{ "name": "...", "email": "...", "phone": "...", "message": "..." }`,
    resp: `{ "ok": true }`,
  },
  {
    method: 'POST', path: '/api/widget/{botId}/feedback',
    desc: 'Thumbs up/down on a bot message.',
    body: `{ "messageId": "...", "value": 1 }`,
    resp: `{ "ok": true }`,
  },
  {
    method: 'POST', path: '/api/widget/{botId}/upload',
    desc: 'Upload an image/document (multipart). Allowed: jpg/png/gif/webp/pdf/docx, ≤10MB.',
    resp: `{ "ok": true, "attachment": { "url", "pathname", "filename", "mimeType", "kind" } }`,
  },
  {
    method: 'GET', path: '/api/health',
    desc: 'Liveness/readiness probe. 200 healthy, 503 down. No secrets exposed.',
    resp: `{ "ok": true, "status": "healthy", "checks": { ... } }`,
  },
];

export default function ApiDocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-200">
      <p className="text-xs font-mono uppercase tracking-widest text-blue-400">API · v1</p>
      <h1 className="text-3xl font-bold text-white mt-2">Peit API</h1>
      <p className="text-gray-400 mt-3">
        Public widget API. All requests are rate-limited and scoped to a bot id.
        Versioned responses carry <code className="text-blue-300">X-API-Version: 1</code>.
        Index: <code className="text-blue-300">GET /api/v1</code>.
      </p>

      <div className="mt-10 space-y-8">
        {ENDPOINTS.map(e => (
          <section key={e.path} className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                {e.method}
              </span>
              <code className="text-sm text-white">{e.path}</code>
            </div>
            <p className="text-sm text-gray-400 mt-3">{e.desc}</p>
            {e.body && (
              <>
                <p className="text-xs uppercase tracking-wide text-gray-500 mt-4 mb-1">Request</p>
                <pre className="text-xs bg-[#0a0a12] border border-white/[0.06] rounded-lg p-3 overflow-x-auto text-gray-300"><code>{e.body}</code></pre>
              </>
            )}
            <p className="text-xs uppercase tracking-wide text-gray-500 mt-4 mb-1">Response</p>
            <pre className="text-xs bg-[#0a0a12] border border-white/[0.06] rounded-lg p-3 overflow-x-auto text-gray-300"><code>{e.resp}</code></pre>
          </section>
        ))}
      </div>
    </main>
  );
}
