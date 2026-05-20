'use client';

// URL-driven date range picker. Writes the chosen preset to ?range=...
// (and ?from / ?to for custom) so the page is shareable and re-renders as
// a Server Component on change. We deliberately use useSearchParams +
// router.push instead of a local useState — the source of truth is the URL.

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Calendar, Loader2 } from 'lucide-react';

const PRESETS: { key: '7d' | '30d' | '90d'; label: string }[] = [
  { key: '7d',  label: '7 დღე' },
  { key: '30d', label: '30 დღე' },
  { key: '90d', label: '90 დღე' },
];

interface Props { current: '7d' | '30d' | '90d' | 'custom' }

export default function RangePicker({ current }: Props) {
  const router = useRouter();
  const path   = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setRange(next: typeof current) {
    const p = new URLSearchParams(params.toString());
    p.set('range', next);
    // Wipe custom-window bounds — they don't apply to presets.
    if (next !== 'custom') { p.delete('from'); p.delete('to'); }
    startTransition(() => router.push(`${path}?${p.toString()}`));
  }

  function setCustom(from: string, to: string) {
    if (!from || !to) return;
    const p = new URLSearchParams(params.toString());
    p.set('range', 'custom');
    p.set('from', from);
    p.set('to',   to);
    startTransition(() => router.push(`${path}?${p.toString()}`));
  }

  const isCustom = current === 'custom';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => setRange(p.key)}
            disabled={pending}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              current === p.key
                ? 'bg-violet-500/90 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <details className="relative">
        <summary className={`list-none cursor-pointer px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 ${
          isCustom
            ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
            : 'bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white'
        }`}>
          <Calendar className="w-3 h-3" />
          {isCustom ? 'მორგებული' : 'მორგებული'}
        </summary>
        <div className="absolute top-full mt-1 left-0 z-10 bg-[#0d0d1a] border border-white/10 rounded-lg p-3 shadow-2xl w-64">
          <CustomDateInput onApply={setCustom} />
        </div>
      </details>

      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />}
    </div>
  );
}

function CustomDateInput({ onApply }: { onApply: (from: string, to: string) => void }) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onApply(String(fd.get('from')), String(fd.get('to')));
      }}
      className="flex flex-col gap-2"
    >
      <label className="text-[11px] text-gray-500 flex flex-col gap-1">
        დაწყება
        <input
          name="from"
          type="date"
          required
          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
        />
      </label>
      <label className="text-[11px] text-gray-500 flex flex-col gap-1">
        დასასრული
        <input
          name="to"
          type="date"
          required
          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
        />
      </label>
      <button
        type="submit"
        className="text-xs bg-violet-500/90 hover:bg-violet-500 text-white rounded py-1.5 mt-1"
      >
        გამოყენება
      </button>
    </form>
  );
}
