// /dashboard/settings/* shared shell.
//
// Top-level auth gate + a left sidebar of section links. Each page
// renders inside the right column so the sidebar persists across
// section switches without a full re-render of the header.
//
// Sidebar highlighting lives in <SettingsNav/> (client) because it needs
// pathname; the shell itself stays server-rendered.

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import type { Metadata } from 'next';

import SettingsNav from '@/components/settings/SettingsNav';

export const metadata: Metadata = {
  title: 'პარამეტრები — Peit',
};

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  return (
    <div className="min-h-screen bg-[#07070f]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-4 h-4 text-violet-300" />
            <span className="font-semibold">პარამეტრები</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-8">
          <SettingsNav />
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
