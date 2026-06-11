'use client';

// Our own avatar menu — replaces Clerk's <UserButton> so no Clerk UI is
// visible anywhere. Avatar + dropdown with the account email, dashboard /
// settings shortcuts and sign-out (headless via useClerk().signOut).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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
  const initial = (name || email).slice(0, 1).toUpperCase();

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
          <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold grid place-items-center">{initial}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#0d0d1a] shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            {name && <p className="text-sm font-semibold text-white truncate">{name}</p>}
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>
          <div className="py-1.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-gray-500" /> Dashboard
            </Link>
            <Link
              href="/dashboard/settings/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" /> {en ? 'Settings' : 'პარამეტრები'}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); void signOut(() => router.push('/')); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 border-t border-white/[0.06] text-sm text-red-300 hover:text-red-200 hover:bg-red-500/[0.06] transition-colors"
          >
            <LogOut className="w-4 h-4" /> {en ? 'Sign out' : 'გასვლა'}
          </button>
        </div>
      )}
    </div>
  );
}
