// Branded 404. Same dark theme as the rest of the site, with three
// suggested links so a dead URL doesn't dead-end the visitor.
//
// noindex: robots is set via metadata so search engines don't surface
// missing-page URLs as canonical entries.

import Link from 'next/link';
import { Home, Zap, FileText, DollarSign, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:  '404 — გვერდი ვერ მოიძებნა · Peit',
  robots: { index: false, follow: false },
};

const SUGGESTIONS = [
  { href: '/#features', label: 'ფუნქციები · Features',  icon: FileText    },
  { href: '/pricing',   label: 'ფასები · Pricing',      icon: DollarSign  },
  { href: '/blog',      label: 'ბლოგი · Blog',          icon: BookOpen    },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-12 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-2xl tracking-tight">Peit</span>
      </Link>

      <div className="text-center max-w-lg">
        <p className="text-[120px] sm:text-[160px] leading-none font-bold tracking-tighter bg-gradient-to-b from-violet-300 via-violet-500 to-violet-900 bg-clip-text text-transparent mb-2">
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
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-5 py-2.5 rounded-lg shadow-lg shadow-violet-500/30 mb-12 transition-colors"
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
                  className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-violet-300 transition-colors"
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
