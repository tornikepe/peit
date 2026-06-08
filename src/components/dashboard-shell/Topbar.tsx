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
import { useEffect, useRef, useState } from 'react';
import { Menu, Search, Bell, Plus, Settings, Sun, Moon } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

interface Props {
  onMenuClick: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function Topbar({ onMenuClick, theme = 'dark', onToggleTheme }: Props) {
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
          <Link
            href="/dashboard/bots/new"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-3 py-1.5 rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3 h-3" /> ახალი ბოტი
          </Link>

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white"
              aria-label={theme === 'dark' ? 'ნათელ თემაზე გადართვა' : 'მუქ თემაზე გადართვა'}
              title="თემა"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <NotificationsBell />

          <UserButton />
        </div>
      </div>
    </header>
  );
}

// Notifications bell — opens a dropdown panel. There's no notifications
// backend yet, so it shows an honest empty state plus a shortcut to the
// notification settings (where email prefs live). The previous version was
// a dead button with a hardcoded "unread" dot that never did anything.
function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-lg hover:bg-white/[0.05] ${open ? 'text-white bg-white/[0.05]' : 'text-gray-400 hover:text-white'}`}
        aria-label="notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/[0.08] bg-[#0d0d1a] shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white">შეტყობინებები</p>
          </div>
          <div className="px-4 py-8 flex flex-col items-center text-center">
            <Bell className="w-6 h-6 text-gray-600 mb-2" />
            <p className="text-xs text-gray-500">ახალი შეტყობინება არ არის</p>
          </div>
          <Link
            href="/dashboard/settings/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] text-xs text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            შეტყობინებების პარამეტრები
          </Link>
        </div>
      )}
    </div>
  );
}
