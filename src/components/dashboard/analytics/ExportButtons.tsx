'use client';

// CSV / PDF export buttons. CSV is a real server endpoint
// (/api/analytics/export). PDF is window.print() with a print-friendly
// CSS variant — keeps the bundle lean (no Puppeteer / jsPDF) and the
// browser handles paper size + headers.

import { useSearchParams } from 'next/navigation';
import { Download, Printer } from 'lucide-react';

export default function ExportButtons() {
  const params = useSearchParams();

  function exportUrl(type: 'conversations' | 'leads'): string {
    const p = new URLSearchParams();
    p.set('type', type);
    const range = params.get('range') ?? '30d';
    p.set('range', range);
    if (range === 'custom') {
      const from = params.get('from');
      const to   = params.get('to');
      if (from) p.set('from', from);
      if (to)   p.set('to',   to);
    }
    return `/api/analytics/export?${p.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={exportUrl('conversations')}
        className="text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.06] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
      >
        <Download className="w-3 h-3" /> საუბრები CSV
      </a>
      <a
        href={exportUrl('leads')}
        className="text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.06] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
      >
        <Download className="w-3 h-3" /> ლიდები CSV
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.06] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
      >
        <Printer className="w-3 h-3" /> PDF / ბეჭდვა
      </button>
    </div>
  );
}
