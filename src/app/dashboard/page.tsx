// /dashboard — overview. Renders inside the shared dashboard chrome
// (sidebar + topbar) provided by layout.tsx, so we only render the page
// content here — no header, no nav.

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';

import PageHeader from '@/components/dashboard-shell/PageHeader';
import BotsList from '@/components/dashboard/BotsList';
import DashboardStats from '@/components/dashboard/DashboardStats';
import MigrationBanner from '@/components/dashboard/MigrationBanner';
import UsagePanel from '@/components/dashboard/UsagePanel';

export const metadata: Metadata = {
  title: 'Dashboard — Peit',
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  const user = await currentUser();
  const firstName = user?.firstName ?? 'მომხმარებელი';

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`გამარჯობა, ${firstName} 👋`}
        subtitle="ბოტების მართვა, საუბრების მონიტორინგი, ლიდების შეგროვება — ერთ ადგილზე."
        action={
          <Link
            href="/dashboard/bots/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            ახალი ბოტი
          </Link>
        }
      />

      {/* Inline-render only when an actual cloud-vs-local migration is pending. */}
      <MigrationBanner />

      <section className="mb-6">
        <UsagePanel />
      </section>

      <section className="mb-6">
        <DashboardStats />
      </section>

      <section>
        <BotsList />
      </section>
    </>
  );
}
