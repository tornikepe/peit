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
import T from '@/components/T';

export const metadata: Metadata = {
  title: 'Dashboard — Peit',
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/?signin=1');

  // currentUser() can throw with ClerkAPIResponseError when the JWT is
  // valid for `userId` (auth() above passed) but a downstream call to
  // Clerk's user endpoint fails — most commonly because the dev session
  // was issued for a different port (3000 vs 3001) and Clerk treats
  // them as different origins. Treat that as "session needs refresh"
  // and bounce to sign-in instead of crashing the whole dashboard.
  let user;
  try {
    user = await currentUser();
  } catch (e) {
    console.warn('[dashboard] currentUser() failed, redirecting to /signin:', e instanceof Error ? e.message : e);
    redirect('/?signin=1');
  }
  // Greet by the user's real name — first name, else username, else the
  // local part of their email (so it never falls back to a generic word
  // unless the account truly has nothing to show).
  const firstName =
    user?.firstName?.trim()
    || user?.username?.trim()
    || user?.primaryEmailAddress?.emailAddress?.split('@')[0]
    || null;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={<T ka={`გამარჯობა, ${firstName ?? 'მომხმარებელო'} 👋`} en={`Hello, ${firstName ?? 'there'} 👋`} />}
        subtitle={<T ka="ბოტების მართვა, საუბრების მონიტორინგი, ლიდების შეგროვება — ერთ ადგილზე." en="Manage bots, monitor conversations, collect leads — all in one place." />}
        action={
          <Link
            href="/dashboard/bots/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <T ka="ახალი ბოტი" en="New bot" />
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
