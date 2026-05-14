// GET /api/leads/export?botId&status
// Streams a CSV download of the user's leads. RFC 4180 compliant —
// fields with commas / quotes / newlines are quoted, internal quotes
// are doubled. UTF-8 BOM prefix so Excel opens Georgian text correctly.

import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getCurrentUserOrThrow } from '@/db/queries/users';
import {
  exportLeadsForUser, type LeadStatus, type LeadFilters,
} from '@/db/queries/leads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set<LeadStatus>([
  'new', 'contacted', 'qualified', 'won', 'lost',
]);

/** RFC 4180 quote — wrap in "..." and double internal quotes when needed. */
function csvField(v: string | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  }
  let user;
  try { user = await getCurrentUserOrThrow(); }
  catch { return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }); }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  if (statusParam && !VALID_STATUSES.has(statusParam as LeadStatus)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  const filters: Omit<LeadFilters, 'limit' | 'offset'> = {
    botId:  url.searchParams.get('botId')  ?? undefined,
    status: (statusParam as LeadStatus | null) ?? undefined,
    search: url.searchParams.get('search')?.trim() || undefined,
  };

  const leads = await exportLeadsForUser(user.id, filters);

  const header = ['date', 'bot', 'name', 'email', 'phone', 'message', 'status'];
  const rows = leads.map(l => [
    l.createdAt.toISOString(),
    l.botName,
    l.name ?? '',
    l.email ?? '',
    l.phone ?? '',
    l.message ?? '',
    l.status,
  ].map(csvField).join(','));

  // BOM so Excel auto-detects UTF-8 for Georgian glyphs.
  const csv = '﻿' + header.join(',') + '\n' + rows.join('\n') + '\n';

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `peit-leads-${stamp}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}
