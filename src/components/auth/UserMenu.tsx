'use client';

// Our own avatar menu — replaces Clerk's <UserButton> so no Clerk UI is
// visible anywhere. Centered dropdown: avatar + name + email on top, then
// the navigation items and sign-out. Fully bilingual (ka/en).

import { useEffect, useRef, useState } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
    <div ref={ref} className="relative">
      <button
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

      {open && (
        <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-white/[0.1] bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden z-50 text-center">
          {/* Identity header — centered over a soft brand glow */}
          <div
            className="relative px-4 pt-6 pb-5 flex flex-col items-center gap-2.5 border-b border-white/[0.07]"
            style={{ background: 'radial-gradient(140px 90px at 50% 0%, rgba(59,130,246,0.18), transparent 70%)' }}
          >
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={name || email}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/50 shadow-lg shadow-blue-600/25"
              />
            ) : (
              <DefaultAvatar label={name || email} size={64} className="ring-2 ring-blue-500/50 shadow-lg shadow-blue-600/25" />
            )}
            {name && <p className="text-[15px] font-bold text-white truncate max-w-full tracking-tight">{name}</p>}
            <span className="text-[11px] text-gray-400 truncate max-w-full bg-white/[0.05] border border-white/[0.07] rounded-full px-3 py-1">
              {email}
            </span>
          </div>

          <div className="py-2.5 flex flex-col gap-1">
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:text-red-200 border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.14] hover:border-red-500/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {en ? 'Sign out' : 'გასვლა'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
