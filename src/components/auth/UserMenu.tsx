'use client';

// Our own avatar menu — replaces Clerk's <UserButton> so no Clerk UI is
// visible anywhere. The dropdown is rendered in a PORTAL on document.body so
// it escapes the marketing site's .ms-root reset (which would otherwise
// repaint the links/sign-out white and kill the hovers) — guaranteeing it
// looks and behaves identically on the homepage and the dashboard.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

/** Branded fallback avatar — blue→indigo gradient with the user's initial. */
export function DefaultAvatar({ label, size = 32, className = '' }: { label: string; size?: number; className?: string }) {
  return (
    <span
      className={`rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white font-bold grid place-items-center select-none ring-1 ring-white/20 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function UserMenu() {
  const en = useLanguage().lang === 'en';
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Anchor the fixed portal menu under the avatar button. Recomputed on open
  // and kept in sync while scrolling / resizing.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 10, right: Math.max(10, window.innerWidth - r.right) });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  if (!user) return null;

  const name  = user.fullName || user.firstName || user.username || '';
  const email = user.primaryEmailAddress?.emailAddress ?? '';

  const itemCls =
    'group flex items-center justify-center gap-2.5 mx-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ' +
    'text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors';
  const chipCls =
    'w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 grid place-items-center ' +
    'group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-colors';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="account menu"
        aria-expanded={open}
        className={`block rounded-full ring-2 transition-shadow ${open ? 'ring-blue-500/60' : 'ring-transparent hover:ring-white/20'}`}
      >
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt={name || email} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <DefaultAvatar label={name || email} size={32} />
        )}
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, right: pos.right }}
          className="w-[min(17rem,calc(100vw-1.25rem))] origin-top-right animate-menu-pop rounded-2xl border border-white/[0.1] bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden z-[100] text-center"
        >
          {/* Identity header — centered over a soft brand glow */}
          <div
            className="relative px-4 pt-5 pb-4 flex flex-col items-center gap-2 border-b border-white/[0.07]"
            style={{ background: 'radial-gradient(130px 80px at 50% 0%, rgba(59,130,246,0.18), transparent 70%)' }}
          >
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={name || email}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/50 shadow-lg shadow-blue-600/25"
              />
            ) : (
              <DefaultAvatar label={name || email} size={56} className="ring-2 ring-blue-500/50 shadow-lg shadow-blue-600/25" />
            )}
            {name && <p className="text-sm font-bold text-white truncate max-w-full tracking-tight">{name}</p>}
            <span className="text-[11px] text-gray-400 truncate max-w-[calc(100%-1rem)] bg-white/[0.05] border border-white/[0.07] rounded-full px-2.5 py-1">
              {email}
            </span>
          </div>

          <div className="py-2 flex flex-col gap-0.5">
            <Link href="/dashboard" onClick={() => setOpen(false)} className={itemCls}>
              <span className={chipCls}><LayoutDashboard className="w-3.5 h-3.5 text-blue-400" /></span>
              {en ? 'Dashboard' : 'მთავარი'}
            </Link>
            <Link href="/dashboard/settings/profile" onClick={() => setOpen(false)} className={itemCls}>
              <span className={chipCls}><Settings className="w-3.5 h-3.5 text-blue-400" /></span>
              {en ? 'Settings' : 'პარამეტრები'}
            </Link>
          </div>

          <div className="px-2.5 pb-2.5 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); void signOut(() => router.push('/')); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:text-red-200 border border-red-500/25 bg-red-500/[0.08] hover:bg-red-500/[0.18] hover:border-red-500/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {en ? 'Sign out' : 'გასვლა'}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
