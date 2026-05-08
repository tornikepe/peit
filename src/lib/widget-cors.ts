// CORS helpers for the public /api/widget/* endpoints.
// These routes are intentionally cross-origin: any host site that embeds
// our widget needs to be able to call them. Future enhancement: per-bot
// domain allowlist.

import { NextResponse } from 'next/server';

const ALLOWED_HEADERS = 'content-type, x-peit-conversation-id';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Max-Age':       '86400',
};

/** Standard response for OPTIONS preflight. */
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Wrap a JSON payload with CORS headers. */
export function corsJson<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: CORS_HEADERS,
  });
}

export function corsError(status: number, code: string, msg?: string) {
  return corsJson({ error: code, message: msg }, { status });
}
