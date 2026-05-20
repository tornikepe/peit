// /dashboard/analytics — server-rendered analytics dashboard.
//
// Architecture:
//   - The page IS a Server Component. It owns the data fetch (8 queries
//     to lib/analytics.ts run in parallel via Promise.all) and renders
//     the static HTML for KPIs, lists, tables and the funnel.
//   - Interactive bits — date range picker, channel filter on the line
//     chart, export buttons — are Client Components scoped to leaves.
//
// URL params:
//   ?range=7d|30d|90d|custom
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD   (only when range=custom)
//   ?channel=web|telegram|instagram|facebook  (line chart only)
//
// Auth: page-level redirect to /signin when there's no Clerk session.
// Bot-ownership scoping is enforced inside each analytics query (joins
// on bots.owner_id).

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';

import { getCurrentUserOrThrow } from '@/db/queries/users';
import {
  rangeFromPreset,
  getKpis,
  getConversationsByDay,
  getTopUserMessages,
  getUnansweredQuestions,
  getFunnel,
  getGeoBreakdown,
  getHourHeatmap,
  type RangePreset,
  type Channel,
} from '@/lib/analytics';

import RangePicker from '@/components/dashboard/analytics/RangePicker';
import KpiCards from '@/components/dashboard/analytics/KpiCards';
import ConversationsChart from '@/components/dashboard/analytics/ConversationsChart';
import TopQuestionsList from '@/components/dashboard/analytics/TopQuestionsList';
import UnansweredList from '@/components/dashboard/analytics/UnansweredList';
import Funnel from '@/components/dashboard/analytics/Funnel';
import GeoTable from '@/components/dashboard/analytics/GeoTable';
import Heatmap from '@/components/dashboard/analytics/Heatmap';
import ExportButtons from '@/components/dashboard/analytics/ExportButtons';

export const metadata: Metadata = {
  title: 'ანალიტიკა — Peit',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    range?:   string;
    from?:    string;
    to?:      string;
    channel?: string;
  }>;
}

function parsePreset(v: string | undefined): RangePreset {
  if (v === '7d' || v === '30d' || v === '90d' || v === 'custom') return v;
  return '30d';
}

function parseChannel(v: string | undefined): Channel | undefined {
  if (v === 'web' || v === 'telegram' || v === 'instagram' || v === 'facebook') return v;
  return undefined;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  const params  = await searchParams;
  const preset  = parsePreset(params.range);
  const channel = parseChannel(params.channel);
  const range   = rangeFromPreset(preset, params.from, params.to);

  // Resolve our internal user row; all analytics joins go through bots.owner_id.
  const user = await getCurrentUserOrThrow();

  // 8 parallel queries — Neon handles them as concurrent statements on the
  // same pooled connection. Worst-case combined latency ≈ slowest single
  // query (the funnel, ~200ms on 100k rows).
  const [
    kpis,
    dailyPoints,
    topQuestions,
    unanswered,
    funnel,
    geo,
    heat,
  ] = await Promise.all([
    getKpis(user.id, range),
    getConversationsByDay(user.id, range, channel),
    getTopUserMessages(user.id, range, 10),
    getUnansweredQuestions(user.id, range, 15),
    getFunnel(user.id, range),
    getGeoBreakdown(user.id, range, 50),
    getHourHeatmap(user.id, range),
  ]);

  const rangeLabel = formatRangeLabel(range, preset);

  return (
    <div className="min-h-screen bg-[#07070f] print:bg-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-white">
            <BarChart3 className="w-4 h-4 text-violet-300" />
            <span className="font-semibold">ანალიტიკა</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 print:py-2">
        {/* Top controls */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 print:mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">ანალიტიკა</h1>
            <p className="text-sm text-gray-500 mt-1">{rangeLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <RangePicker current={preset} />
            <ExportButtons />
          </div>
        </section>

        {/* KPIs */}
        <section className="mb-6">
          <KpiCards kpis={kpis} />
        </section>

        {/* Chart + Funnel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <ConversationsChart points={dailyPoints} channel={channel} />
          </div>
          <Funnel data={funnel} />
        </section>

        {/* Top questions + Unanswered */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <TopQuestionsList items={topQuestions} />
          <UnansweredList   items={unanswered}   />
        </section>

        {/* Geo + Heatmap */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <GeoTable rows={geo} />
          <div className="lg:col-span-2">
            <Heatmap cells={heat} />
          </div>
        </section>

        <p className="text-[10px] text-gray-600 text-center mt-8 print:mt-4">
          ანალიტიკის მონაცემები რეალურ დროში მუშავდება — განახლება ხდება ყოველ მოთხოვნაზე
        </p>
      </main>
    </div>
  );
}

function formatRangeLabel(range: { from: Date; to: Date }, preset: RangePreset): string {
  const fmt = new Intl.DateTimeFormat('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });
  const from = fmt.format(range.from);
  const to   = fmt.format(range.to);
  const presetLabel =
    preset === '7d' ? 'უკანასკნელი 7 დღე'
  : preset === '90d' ? 'უკანასკნელი 90 დღე'
  : preset === 'custom' ? 'მორგებული პერიოდი'
  :                     'უკანასკნელი 30 დღე';
  return `${presetLabel} · ${from} – ${to}`;
}
