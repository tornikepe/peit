// /dashboard/conversations — owner-side conversation history with search,
// filter, paginate, and slide-in transcript drawer.
//
// The page itself is a thin Server Component shell — auth gate + chrome.
// All interactivity (search, filter dropdown, drawer, exports) lives in
// the <ConversationList /> client tree.

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

import ConversationList from '@/components/conversations/ConversationList';

export const metadata: Metadata = {
  title: 'საუბრების ისტორია — Peit',
};

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
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
            <MessageSquare className="w-4 h-4 text-violet-300" />
            <span className="font-semibold">საუბრების ისტორია</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">საუბრების ისტორია</h1>
          <p className="text-sm text-gray-500 mt-1">
            ყველა customer-დან მიღებული საუბარი ერთ ადგილზე — ვებსაიტი, Telegram, Instagram, Messenger
          </p>
        </div>

        <ConversationList />
      </main>
    </div>
  );
}
