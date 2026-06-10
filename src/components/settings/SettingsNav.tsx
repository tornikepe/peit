'use client';

// Settings sidebar navigation. Highlights the active section based on
// the current pathname. On mobile (<md) it's a horizontal scroll strip
// rather than a column so the page content gets all the vertical room.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, CreditCard, Users, Key, Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const ITEMS = [
  { href: '/dashboard/settings/profile',       ka: 'პროფილი',        en: 'Profile',       icon: User       },
  { href: '/dashboard/settings/billing',       ka: 'გადახდები',      en: 'Billing',       icon: CreditCard },
  { href: '/dashboard/settings/team',          ka: 'გუნდი',          en: 'Team',          icon: Users      },
  { href: '/dashboard/settings/api-keys',      ka: 'API გასაღებები', en: 'API keys',      icon: Key        },
  { href: '/dashboard/settings/notifications', ka: 'ნოტიფიკაციები',  en: 'Notifications', icon: Bell       },
];

export default function SettingsNav() {
  const path = usePathname();
  const en = useLanguage().lang === 'en';

  return (
    <nav className="md:sticky md:top-20 md:self-start">
      <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
        {ITEMS.map(({ href, ka, en: enLabel, icon: Icon }) => {
          const label = en ? enLabel : ka;
          // `startsWith` so trailing-slash variants and nested routes
          // still highlight (currently we have no nesting under settings,
          // but better to future-proof).
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-violet-500/15 text-white border border-violet-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
