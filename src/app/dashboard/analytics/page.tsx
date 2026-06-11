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
import type { Metadata } from 'next';

import PageHeader from '@/components/dashboard-shell/PageHeader';
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
import T from '@/components/T';

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

  const rangeLabelKa = formatRangeLabel(range, preset, false);
  const rangeLabelEn = formatRangeLabel(range, preset, true);

  return (
    <div className="print:bg-white">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Analytics"
          title={<T ka="ანალიტიკა" en="Analytics" />}
          subtitle={<T ka={rangeLabelKa} en={rangeLabelEn} />}
          action={
            <>
              <RangePicker current={preset} />
              <ExportButtons />
            </>
          }
        />
      </div>

      {/* Print-only header — narrower, no controls. */}
      <header className="hidden print:block mb-3">
        <h1 className="text-2xl font-bold text-black"><T ka="ანალიტიკა" en="Analytics" /></h1>
        <p className="text-sm text-gray-700 mt-1"><T ka={rangeLabelKa} en={rangeLabelEn} /></p>
      </header>

      <section className="mb-6">
        <KpiCards kpis={kpis} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ConversationsChart points={dailyPoints} channel={channel} />
        </div>
        <Funnel data={funnel} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TopQuestionsList items={topQuestions} />
        <UnansweredList   items={unanswered}   />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GeoTable rows={geo} />
        <div className="lg:col-span-2">
          <Heatmap cells={heat} />
        </div>
      </section>

      <p className="text-[10px] text-gray-600 text-center mt-8 print:mt-4">
        <T ka="ანალიტიკის მონაცემები რეალურ დროში მუშავდება — განახლება ხდება ყოველ მოთხოვნაზე" en="Analytics are processed in real time — refreshed on every request" />
      </p>
    </div>
  );
}

function formatRangeLabel(range: { from: Date; to: Date }, preset: RangePreset, en: boolean): string {
  const fmt = new Intl.DateTimeFormat(en ? 'en-US' : 'ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });
  const from = fmt.format(range.from);
  const to   = fmt.format(range.to);
  const presetLabel = en
    ? (preset === '7d' ? 'Last 7 days' : preset === '90d' ? 'Last 90 days' : preset === 'custom' ? 'Custom range' : 'Last 30 days')
    : (preset === '7d' ? 'უკანასკნელი 7 დღე' : preset === '90d' ? 'უკანასკნელი 90 დღე' : preset === 'custom' ? 'მორგებული პერიოდი' : 'უკანასკნელი 30 დღე');
  return `${presetLabel} · ${from} – ${to}`;
}
