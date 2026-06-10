// KPI strip — 4 cards across the top of the analytics page.
// Each card surfaces a single number plus an optional delta vs. the
// previous equal-length window. Server-rendered — props are the already-
// fetched Kpis object from lib/analytics.

import { MessageSquare, Send, Users, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import T from '@/components/T';
import type { Kpis } from '@/lib/analytics';

interface Props { kpis: Kpis }

export default function KpiCards({ kpis }: Props) {
  const delta = computeDelta(kpis.conversations, kpis.conversationsPrev);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        icon={<MessageSquare className="w-4 h-4" />}
        label={<T ka="საუბრები" en="Conversations" />}
        value={kpis.conversations}
        delta={delta}
      />
      <Card
        icon={<Send className="w-4 h-4" />}
        label={<T ka="ბოტის პასუხები" en="Bot replies" />}
        value={kpis.messagesFromBot}
      />
      <Card
        icon={<Users className="w-4 h-4" />}
        label={<T ka="ლიდები" en="Leads" />}
        value={kpis.leads}
        sub={kpis.leadsConverted > 0 ? `${kpis.leadsConverted} won` : undefined}
      />
      <Card
        icon={<TrendingUp className="w-4 h-4" />}
        label={<T ka="კონვერსია" en="Conversion" />}
        value={`${kpis.conversionRatePct}%`}
        sub={kpis.leads === 0 ? <T ka="ლიდები ჯერ არ არის" en="No leads yet" /> : `${kpis.leadsConverted} / ${kpis.leads}`}
      />
    </div>
  );
}

interface Delta { pct: number; up: boolean; meaningful: boolean }

function computeDelta(current: number, previous: number): Delta | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { pct: 100, up: current > 0, meaningful: true };
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return { pct: Math.abs(pct), up: pct >= 0, meaningful: Math.abs(pct) >= 0.5 };
}

function Card({
  icon, label, value, sub, delta,
}: {
  icon:   React.ReactNode;
  label:  React.ReactNode;
  value:  number | string;
  sub?:   React.ReactNode;
  delta?: Delta | null;
}) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-300 flex items-center justify-center">
          {icon}
        </div>
        {delta?.meaningful && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${
            delta.up ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {delta.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {delta.pct}%
          </span>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('ka-GE') : value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}
