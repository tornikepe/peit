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
    'flex items-center justify-center gap-2 mx-2 px-3 py-2.5 rounded-xl text-sm ' +
    'text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors';

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
        <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-white/[0.1] bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden z-50 text-center">
          {/* Identity header — centered */}
          <div className="px-4 pt-5 pb-4 border-b border-white/[0.06] flex flex-col items-center gap-2">
            {user.imageUrl ? (
              <Image src={user.imageUrl} alt={name || email} width={48} height={48} className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/30" />
            ) : (
              <DefaultAvatar label={name || email} size={48} className="ring-2 ring-blue-500/30" />
            )}
            {name && <p className="text-sm font-semibold text-white truncate max-w-full">{name}</p>}
            <p className="text-xs text-gray-500 truncate max-w-full">{email}</p>
          </div>

          <div className="py-2 flex flex-col gap-0.5">
            <Link href="/dashboard" onClick={() => setOpen(false)} className={itemCls}>
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              {en ? 'Dashboard' : 'მთავარი'}
            </Link>
            <Link href="/dashboard/settings/profile" onClick={() => setOpen(false)} className={itemCls}>
              <Settings className="w-4 h-4 text-blue-400" />
              {en ? 'Settings' : 'პარამეტრები'}
            </Link>
          </div>

          <div className="p-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setOpen(false); void signOut(() => router.push('/')); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/[0.08] transition-colors"
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
