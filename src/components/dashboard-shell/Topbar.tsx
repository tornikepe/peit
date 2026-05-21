'use client';

// Persistent top bar across every /dashboard/* page. Three slots:
//   left   — hamburger (mobile only) to toggle Sidebar's drawer
//   center — global search-cum-command (placeholder UI for now)
//   right  — notifications, "new bot" CTA, Clerk user button
//
// We deliberately don't render the brand wordmark here — that lives in
// the sidebar so the top bar can stay thin (56px) and the page's
// PageHeader gets to own the visual hierarchy.

import Link from 'next/link';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import StorageModeBadge from '@/components/dashboard/StorageModeBadge';

interface Props { onMenuClick: () => void }

export default function Topbar({ onMenuClick }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07070f]/85 backdrop-blur-xl">
      <div className="h-14 px-4 sm:px-6 flex items-center gap-3">
        {/* Mobile hamburger — desktop hides it since the sidebar is always visible. */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/[0.05] text-gray-300 hover:text-white"
          aria-label="open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Search input — currently visual-only. Wiring it to a real
            command palette is a separate task. */}
        <div className="hidden sm:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="search"
            placeholder="ბოტი, საუბარი, ლიდი..."
            className="w-full bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.10] focus:border-violet-500/40 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none transition-colors"
          />
        </div>

        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-1 sm:gap-2">
          <StorageModeBadge />

          <Link
            href="/dashboard/bots/new"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-3 py-1.5 rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3 h-3" /> ახალი ბოტი
          </Link>

          <button
            type="button"
            className="relative p-2 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white"
            aria-label="notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-500" />
          </button>

          <UserButton />
        </div>
      </div>
    </header>
  );
}
