// GET /api/conversations/[id]/export?format=json|csv
//
// JSON  → full conversation object same as GET /api/conversations/[id],
//         served with Content-Disposition: attachment so the browser
//         downloads instead of rendering.
// CSV   → one row per message, columns: timestamp,role,message. Excel-
//         friendly UTF-8 BOM so Georgian renders correctly when the file
//         is opened in Excel/Numbers.

import { NextResponse } from 'next/server';
import { withAuth, jsonError } from '@/app/api/_helpers';
import { getConversationDetail } from '@/db/queries/conversations';

export const runtime = 'nodejs';

/** RFC-4180-flavoured CSV cell escape — wrap if it has quotes, commas or newlines. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET = withAuth<{ id: string }>(async ({ user, req, params }) => {
  if (!params.id) return jsonError(400, 'MISSING_ID');

  const detail = await getConversationDetail(user.id, params.id);
  if (!detail) return jsonError(404, 'NOT_FOUND');

  const url = new URL(req.url);
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();
  // Filename uses the conversation's short ID (first 8 chars of uuid) so a
  // browser save dialog stays readable without exposing the full opaque id.
  const shortId = detail.id.slice(0, 8);

  if (format === 'csv') {
    const lines = ['timestamp,role,message'];
    for (const m of detail.messages) {
      lines.push([cell(m.createdAt), cell(m.role), cell(m.content)].join(','));
    }
    const csv = '﻿' + lines.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="conversation-${shortId}.csv"`,
        'Cache-Control':       'no-store',
      },
    });
  }

  if (format !== 'json') {
    return jsonError(400, 'INVALID_FORMAT', 'format must be json or csv');
  }

  // JSON: stream the full detail object with a download header.
  const body = JSON.stringify({
    conversation: {
      id:          detail.id,
      botId:       detail.botId,
      botName:     detail.botName,
      channel:     detail.channel,
      language:    detail.language,
      country:     detail.country,
      city:        detail.city,
      tags:        detail.tags,
      isHandedOff: detail.isHandedOff,
      handedOffAt: detail.handedOffAt?.toISOString() ?? null,
      startedAt:   detail.startedAt.toISOString(),
      endedAt:     detail.endedAt?.toISOString() ?? null,
      metadata:    detail.metadata,
      messages:    detail.messages.map(m => ({
        id:        m.id,
        role:      m.role,
        content:   m.content,
        source:    m.source,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  }, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':        'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="conversation-${shortId}.json"`,
      'Cache-Control':       'no-store',
    },
  });
});
