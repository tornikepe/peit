// Branded 404. Same dark theme as the rest of the site, with three
// suggested links so a dead URL doesn't dead-end the visitor.
//
// noindex: robots is set via metadata so search engines don't surface
// missing-page URLs as canonical entries.

import Link from 'next/link';
import { Home, FileText, DollarSign, Workflow } from 'lucide-react';
import type { Metadata } from 'next';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title:  '404 — გვერდი ვერ მოიძებნა · Peit',
  robots: { index: false, follow: false },
};

// All three point at live homepage sections — /pricing and /blog were
// removed long ago and used to send visitors into a 404 loop.
const SUGGESTIONS = [
  { href: '/#features', label: 'ფუნქციები · Features',       icon: FileText   },
  { href: '/#pricing',  label: 'ფასები · Pricing',           icon: DollarSign },
  { href: '/#how',      label: 'როგორ მუშაობს · How it works', icon: Workflow },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4">
      <div className="mb-12">
        <Logo size="lg" />
      </div>

      <div className="text-center max-w-lg">
        <p className="text-[120px] sm:text-[160px] leading-none font-bold tracking-tighter bg-gradient-to-b from-blue-300 via-blue-500 to-blue-900 bg-clip-text text-transparent mb-2">
          404
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
          გვერდი ვერ მოიძებნა
        </h1>
        <p className="text-gray-400 text-base mb-1">Page not found</p>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
          მოთხოვნილი გვერდი არ არსებობს, ან გადატანილია.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 mb-12 transition-colors"
        >
          <Home className="w-4 h-4" /> მთავარ გვერდზე
        </Link>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            ან ნახე
          </p>
          <ul className="flex flex-col gap-1.5">
            {SUGGESTIONS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-blue-300 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
