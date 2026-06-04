// GET /api/v1 — public API index. Additive: existing routes keep their paths
// (deployed widgets depend on them), this just advertises the stable surface
// and version. Sends X-API-Version on every v1 response.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json(
    {
      version: '1.0.0',
      endpoints: {
        chat:     'POST /api/widget/{botId}/stream',
        config:   'GET  /api/widget/{botId}/config',
        lead:     'POST /api/widget/{botId}/lead',
        feedback: 'POST /api/widget/{botId}/feedback',
        upload:   'POST /api/widget/{botId}/upload',
        health:   'GET  /api/health',
      },
      docs: 'https://peit.vercel.app/docs/api',
    },
    { headers: { 'X-API-Version': '1', 'X-Deprecated': 'false' } },
  );
}
