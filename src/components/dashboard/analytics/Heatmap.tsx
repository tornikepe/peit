// 7×24 hour-of-day × day-of-week heatmap. Each cell's opacity reflects
// the conversation count for that (dow, hour) bucket relative to the
// busiest cell in the window. Server-rendered — pure CSS grid, no JS.

import { Clock } from 'lucide-react';
import T from '@/components/T';
import type { HeatCell } from '@/lib/analytics';

interface Props { cells: HeatCell[] }

// Postgres EXTRACT(dow) → 0=Sunday..6=Saturday. We display Mon→Sun so the
// reader's working week reads left-to-right; reorder + remap accordingly.
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DOW_LABEL_KA = ['ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა', 'კვ'];
const DOW_LABEL_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function Heatmap({ cells }: Props) {
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);

  // Build lookup: dow -> hour -> count.
  const lookup = new Map<number, Map<number, number>>();
  for (const c of cells) {
    if (!lookup.has(c.dow)) lookup.set(c.dow, new Map());
    lookup.get(c.dow)!.set(c.hour, c.count);
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-300" />
          <h3 className="text-white font-semibold"><T ka="აქტიური საათები" en="Active hours" /></h3>
        </div>
        <span className="text-[10px] text-gray-600">UTC</span>
      </div>

      {max === 0 ? (
        <p className="text-xs text-gray-500 py-6 text-center">
          <T ka="ჯერ მონაცემები არ არის" en="No data yet" />
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Hour axis */}
            <div className="grid grid-cols-[28px_repeat(24,1fr)] gap-px mb-1">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="text-[9px] text-gray-600 text-center tabular-nums"
                >
                  {h % 3 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {/* Grid */}
            {DOW_ORDER.map((d, rowIdx) => (
              <div key={d} className="grid grid-cols-[28px_repeat(24,1fr)] gap-px mb-px">
                <div className="text-[10px] text-gray-500 flex items-center justify-end pr-1.5">
                  <T ka={DOW_LABEL_KA[rowIdx]} en={DOW_LABEL_EN[rowIdx]} />
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const v       = lookup.get(d)?.get(h) ?? 0;
                  const opacity = v === 0 ? 0 : 0.15 + 0.85 * (v / max);
                  return (
                    <div
                      key={h}
                      className="aspect-square rounded-sm relative group"
                      style={{
                        backgroundColor: v === 0 ? 'rgba(255,255,255,0.03)' : `rgba(37, 99, 235, ${opacity})`,
                      }}
                      title={`${DOW_LABEL_KA[rowIdx]} ${String(h).padStart(2, '0')}:00 — ${v}`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-600">
              <span><T ka="ნაკლები" en="less" /></span>
              <div className="flex gap-px">
                {[0.15, 0.35, 0.55, 0.75, 1].map(o => (
                  <div
                    key={o}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(37, 99, 235, ${o})` }}
                  />
                ))}
              </div>
              <span><T ka="მეტი" en="more" /> · max {max}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
