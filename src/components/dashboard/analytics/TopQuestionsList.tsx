// Top-10 most frequent user questions. Server-rendered.
//
// We normalise content in SQL (lower+trim+collapse-whitespace) so visually
// identical questions collapse before counting. Each row shows the
// question text, count badge, and a relative bar showing share-of-top.

import { HelpCircle } from 'lucide-react';
import type { TopQuestion } from '@/lib/analytics';

interface Props { items: TopQuestion[] }

export default function TopQuestionsList({ items }: Props) {
  const max = items[0]?.count ?? 1;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-4 h-4 text-violet-300" />
        <h3 className="text-white font-semibold">პოპულარული კითხვები</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-gray-500 py-6 text-center">
          ჯერ არც ერთი კითხვა არ არის
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((q, i) => (
            <li key={i} className="relative">
              <div
                className="absolute inset-y-0 left-0 bg-violet-500/[0.07] rounded-md"
                style={{ width: `${(q.count / max) * 100}%` }}
              />
              <div className="relative flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-gray-200 line-clamp-1" title={q.text}>
                  {q.text}
                </span>
                <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {q.count}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
