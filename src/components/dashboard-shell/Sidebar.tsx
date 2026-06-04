'use client';

// Primary dashboard navigation. Sticky on desktop (≥md), slide-in drawer
// on mobile. Active-route highlight uses `usePathname` with a startsWith
// match so nested routes (e.g. /dashboard/bots/[id]) still light up the
// "Bots" item.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Bot, MessageSquare, BarChart3, Users, CreditCard,
  Settings, ShieldCheck, ChevronRight, X, ThumbsDown, Gift,
} from 'lucide-react';
import Logo from '@/components/Logo';

const NAV: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: '/dashboard',               label: 'მთავარი',     icon: LayoutDashboard },
  { href: '/dashboard/conversations', label: 'საუბრები',    icon: MessageSquare   },
  { href: '/dashboard/feedback',      label: 'გამოხმაურება', icon: ThumbsDown      },
  { href: '/dashboard/leads',         label: 'ლიდები',      icon: Users           },
  { href: '/dashboard/analytics',     label: 'ანალიტიკა',   icon: BarChart3       },
  { href: '/dashboard/billing',       label: 'გადახდები',   icon: CreditCard      },
  { href: '/dashboard/referral',      label: 'მოწვევა',     icon: Gift            },
  { href: '/dashboard/settings/profile', label: 'პარამეტრები', icon: Settings     },
  { href: '/dashboard/privacy',       label: 'GDPR',         icon: ShieldCheck    },
];

/** Match either an exact href OR a route nested under it. */
function isActive(path: string, href: string): boolean {
  if (href === '/dashboard') return path === '/dashboard';
  // settings sub-pages all start with /dashboard/settings; collapse them
  // to highlight the Settings nav item regardless of subsection.
  if (href === '/dashboard/settings/profile') return path.startsWith('/dashboard/settings');
  return path === href || path.startsWith(`${href}/`);
}

interface Props {
  /** Mobile drawer open state, controlled by the topbar's hamburger. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const path = usePathname();

  // Close the drawer whenever the route changes — otherwise tapping a
  // sidebar link on mobile leaves the drawer open over the new page.
  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // We want to react ONLY to path changes here, not handler re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const items = (
    <ul className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <li key={href}>
            <Link
              href={href}
              /* Active row gets a thin gradient rail on the left
                 (.nav-active-rail) + tinted violet wash + glowing icon.
                 Inactive rows brighten subtly on hover so the whole
                 nav reads as one interactive surface, not seven. */
              className={`group flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? 'nav-active-rail bg-gradient-to-r from-violet-500/15 via-violet-500/[0.04] to-transparent text-white border border-violet-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${active ? 'text-violet-300 drop-shadow-[0_0_6px_rgba(147, 197, 253,0.55)]' : 'text-gray-500 group-hover:text-violet-300'}`} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-violet-400" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ── Desktop column ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-[240px] shrink-0 border-r border-white/[0.06] bg-[#0a0a14] sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/[0.04]">
          <Logo size="md" />
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">{items}</nav>

        <div className="p-4 border-t border-white/[0.04] text-[10px] text-gray-600 leading-relaxed">
          © 2026 Peit · ვერსია 1.0
        </div>
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0a0a14] border-r border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.04]">
              <Logo size="md" />
              <button
                type="button"
                onClick={onMobileClose}
                className="p-1.5 -mr-1 rounded-lg hover:bg-white/[0.05] text-gray-400"
                aria-label="close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-3 flex-1 overflow-y-auto">{items}</nav>
          </aside>
        </>
      )}
    </>
  );
}
