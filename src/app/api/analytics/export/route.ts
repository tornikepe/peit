// GET /api/analytics/export?type=conversations|leads&range=7d|30d|90d|custom[&from=&to=]
// Returns: text/csv stream of the user's conversations or leads inside the
// chosen window. The dashboard's "Export CSV" button hits this with the
// active range; the response Content-Disposition triggers a download.
//
// PDF export is intentionally not a backend endpoint — the dashboard uses
// window.print() with a print-friendly CSS variant, which avoids shipping
// a 2MB Puppeteer chunk for what's effectively a screenshot.

import { NextResponse } from 'next/server';
import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  rangeFromPreset,
  getConversationExport,
  getLeadsExport,
  type RangePreset,
} from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** RFC 4180 cell escape — wrap in quotes if it has commas, quotes, or newlines. */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(r.map(csvCell).join(','));
  // BOM so Excel renders Georgian + Cyrillic correctly. Without it Excel
  // misreads UTF-8 as Windows-1252 and customer-visible names look like
  // "Ã'ãƒ¡ãƒ".
  return '﻿' + lines.join('\n');
}

export const GET = withAuth(async ({ user, req }) => {
  const url   = new URL(req.url);
  const type  = url.searchParams.get('type') ?? 'conversations';
  const preset = (url.searchParams.get('range') ?? '30d') as RangePreset;
  const from  = url.searchParams.get('from') ?? undefined;
  const to    = url.searchParams.get('to')   ?? undefined;

  if (type !== 'conversations' && type !== 'leads') {
    return jsonError(400, 'INVALID_TYPE', 'type must be conversations or leads');
  }

  const range = rangeFromPreset(preset, from, to);

  let csv: string;
  let filename: string;
  if (type === 'leads') {
    const rows = await getLeadsExport(user.id, range);
    csv = toCsv(
      ['id', 'botName', 'name', 'email', 'phone', 'status', 'score', 'createdAt'],
      rows.map(r => [r.id, r.botName, r.name, r.email, r.phone, r.status, r.score, r.createdAt]),
    );
    filename = `peit-leads-${preset}.csv`;
  } else {
    const rows = await getConversationExport(user.id, range);
    csv = toCsv(
      ['id', 'botName', 'channel', 'language', 'country', 'city', 'startedAt', 'endedAt', 'messages'],
      rows.map(r => [
        r.id, r.botName, r.channel, r.language, r.country, r.city,
        r.startedAt, r.endedAt, r.messageCnt,
      ]),
    );
    filename = `peit-conversations-${preset}.csv`;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
});
