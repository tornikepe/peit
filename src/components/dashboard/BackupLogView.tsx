'use client';

// Admin-only backup-health table. Calls GET /api/admin/backups (which enforces
// the ADMIN_EMAILS allowlist) and renders the last 7 entries. Non-admins get a
// clear "admin only" message instead of data.

import { useEffect, useState } from 'react';
import { Database, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BackupRow {
  id: string;
  status: 'success' | 'failed';
  sizeBytes: number | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

function fmtSize(bytes: number | null): string {
  if (bytes == null) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export default function BackupLogView() {
  const en = useLanguage().lang === 'en';
  const [rows, setRows]   = useState<BackupRow[] | null>(null);
  const [state, setState] = useState<'loading' | 'forbidden' | 'error' | 'ok'>('loading');

  useEffect(() => {
    fetch('/api/admin/backups')
      .then(async r => {
        if (r.status === 403) { setState('forbidden'); return; }
        if (!r.ok) { setState('error'); return; }
        const j = await r.json();
        setRows(j.backups);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, []);

  if (state === 'loading') return <div className="h-32 rounded-2xl bg-white/[0.03] animate-pulse" />;
  if (state === 'forbidden') return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-8 text-center">
      <ShieldAlert className="w-6 h-6 text-amber-300 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{en ? 'This page is for administrators only.' : 'ეს გვერდი მხოლოდ ადმინისტრატორებისთვისაა.'}</p>
    </div>
  );
  if (state === 'error') return <p className="text-sm text-gray-500">{en ? 'Failed to load.' : 'ჩატვირთვა ვერ მოხერხდა.'}</p>;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <Database className="w-4 h-4 text-blue-300" />
        <h3 className="text-sm font-semibold text-white">{en ? 'Recent backups' : 'ბოლო backup-ები'}</h3>
        <span className="text-xs text-gray-500">(Neon managed + PITR)</span>
      </div>
      {rows && rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-500">{en ? 'No entries yet — the cron runs nightly at 02:00.' : 'ჯერ ჩანაწერი არ არის — cron ღამის 02:00-ზე გაეშვება.'}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="px-5 py-2 font-medium">{en ? 'Status' : 'სტატუსი'}</th>
              <th className="px-5 py-2 font-medium">{en ? 'Size' : 'ზომა'}</th>
              <th className="px-5 py-2 font-medium">{en ? 'Duration' : 'ხანგრძლივობა'}</th>
              <th className="px-5 py-2 font-medium text-right">{en ? 'Date' : 'თარიღი'}</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map(r => (
              <tr key={r.id} className="border-t border-white/[0.05]">
                <td className="px-5 py-3">
                  {r.status === 'success'
                    ? <span className="inline-flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> {en ? 'Success' : 'წარმატება'}</span>
                    : <span className="inline-flex items-center gap-1.5 text-red-300" title={r.error ?? ''}><XCircle className="w-3.5 h-3.5" /> {en ? 'Failed' : 'შეცდომა'}</span>}
                </td>
                <td className="px-5 py-3 text-gray-300">{fmtSize(r.sizeBytes)}</td>
                <td className="px-5 py-3 text-gray-400">{r.durationMs != null ? `${r.durationMs} ms` : '—'}</td>
                <td className="px-5 py-3 text-right text-gray-400">{new Date(r.createdAt).toLocaleString(en ? 'en-US' : 'ka-GE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
