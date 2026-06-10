// Country + city breakdown table. Server-rendered. Sorted by count desc
// (the SQL already returned it that way). Unknown country/city values come
// from non-Vercel runtimes (local dev, edge cache misses) and bucket into
// a single "უცნობი" row.

import { MapPin } from 'lucide-react';
import T from '@/components/T';
import type { GeoRow } from '@/lib/analytics';

interface Props { rows: GeoRow[] }

/** ISO 3166-1 alpha-2 → emoji flag. Each letter offsets into the regional-
 *  indicator block (U+1F1E6..). Always safe; renders as country flag on
 *  every modern OS. */
function flag(cc: string | null): string {
  if (!cc || cc.length !== 2) return '🌐';
  const base = 0x1f1e6;
  const A = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    base + cc.toUpperCase().charCodeAt(0) - A,
    base + cc.toUpperCase().charCodeAt(1) - A,
  );
}

export default function GeoTable({ rows }: Props) {
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-violet-300" />
        <h3 className="text-white font-semibold"><T ka="გეოგრაფია" en="Geography" /></h3>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 py-6 text-center">
          <T ka="ჯერ მონაცემები არ არის" en="No data yet" />
        </p>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-gray-600">
              <tr>
                <th className="text-left font-medium pb-2"><T ka="ქვეყანა" en="Country" /></th>
                <th className="text-left font-medium pb-2"><T ka="ქალაქი" en="City" /></th>
                <th className="text-right font-medium pb-2"><T ka="საუბრები" en="Conversations" /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  <td className="py-1.5">
                    <span className="mr-1.5">{flag(r.country)}</span>
                    <span className="text-gray-300">{r.country ?? <T ka="უცნობი" en="Unknown" />}</span>
                  </td>
                  <td className="py-1.5 text-gray-400">
                    {r.city ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    <span className="text-white">{r.count}</span>
                    {total > 0 && (
                      <span className="text-[10px] text-gray-600 ml-1.5">
                        {Math.round((r.count / total) * 100)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
