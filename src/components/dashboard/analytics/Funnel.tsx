// Conversion funnel. CSS-bar visualisation: Visitors → Conversations →
// Leads → Converted (won). Width of each bar reflects the absolute count,
// the side label shows the drop-off percentage from the previous step.

import { Filter } from 'lucide-react';
import type { Funnel as FunnelData } from '@/lib/analytics';

interface Props { data: FunnelData }

interface Step {
  label:   string;
  value:   number;
  color:   string;
}

export default function Funnel({ data }: Props) {
  const steps: Step[] = [
    { label: 'ვიზიტორები',  value: data.visitors,      color: 'bg-violet-500/60' },
    { label: 'საუბრები',    value: data.conversations, color: 'bg-violet-500/80' },
    { label: 'ლიდები',      value: data.leads,         color: 'bg-fuchsia-500/80' },
    { label: 'დახურული',    value: data.converted,     color: 'bg-emerald-500/80' },
  ];

  const max = Math.max(steps[0].value, 1);
  const hasData = steps[0].value > 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-violet-300" />
        <h3 className="text-white font-semibold">კონვერსიის ფანჯარა</h3>
      </div>

      {!hasData ? (
        <p className="text-xs text-gray-500 py-6 text-center">
          ჯერ მონაცემები არ არის
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {steps.map((s, i) => {
            const widthPct = (s.value / max) * 100;
            const dropPct  = i > 0 && steps[i - 1].value > 0
              ? Math.round((s.value / steps[i - 1].value) * 1000) / 10
              : null;
            return (
              <li key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {s.value.toLocaleString('ka-GE')}
                    </span>
                    {dropPct !== null && (
                      <span className="text-[10px] text-gray-500 tabular-nums w-12 text-right">
                        {dropPct}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-7 bg-white/[0.03] rounded-md overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-md transition-all`}
                    style={{ width: `${Math.max(widthPct, 1.5)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
