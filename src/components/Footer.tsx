'use client';

import Link from "next/link";
import { Mail } from "lucide-react";
import { industries } from "./Industries";
import { useLanguage } from "@/context/LanguageContext";
import Logo from "@/components/Logo";

const alternativeLinks = [
  { labelKey: 'Tidio ალტერნატივა', href: '/alternatives/tidio' },
  { labelKey: 'Drift ალტერნატივა',  href: '/alternatives/drift'  },
  { labelKey: 'Intercom ალტერნატივა', href: '/alternatives/intercom' },
];

export default function Footer() {
  const { t } = useLanguage();
  const f = t.footer;

  // /pricing, /how-it-works and /blog were removed — point at homepage sections
  // so these never 404 from the legal pages.
  const productLinks = [
    { label: f.features,    href: '/#features' },
    { label: f.pricing,     href: '/#pricing'  },
    { label: f.howItWorks,  href: '/#how'      },
    ...alternativeLinks.map(l => ({ label: l.labelKey, href: l.href })),
  ];

  const legalLinks = [
    { label: f.terms,   href: '/terms'   },
    { label: f.privacy, href: '/privacy' },
    { label: f.gdpr,    href: '/gdpr'    },
    { label: f.cookies, href: '/cookies' },
  ];

  function openCookiePrefs() {
    // Bridge to CookieConsent — exposed on `window` after mount.
    const w = window as unknown as { __peit_open_cookie_prefs?: () => void };
    if (typeof w.__peit_open_cookie_prefs === 'function') {
      w.__peit_open_cookie_prefs();
    }
  }

  return (
    <footer className="border-t border-white/[0.06] mt-auto">
      {/* CTA Banner */}
      <div className="py-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 hero-glow pointer-events-none opacity-60" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{f.ctaTitle}</h2>
          <p className="text-gray-400 text-lg mb-8">{f.ctaSub}</p>
          <Link href="/signup"
            className="btn-primary inline-block text-white font-semibold px-10 py-4 rounded-xl text-lg">
            {f.ctaBtn}
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="border-t border-white/[0.06] py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Logo size="md" className="mb-4" />
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.tagline}</p>
              <a href={`mailto:${f.email}`}
                className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {f.email}
              </a>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">{f.product}</p>
              <ul className="flex flex-col gap-2.5">
                {productLinks.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industries */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">{f.industriesLabel}</p>
              <ul className="flex flex-col gap-2.5">
                {industries.map(ind => (
                  <li key={ind.slug}>
                    <Link href={`/industries/${ind.slug}`}
                      className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                      {ind.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">{f.legal}</p>
              <ul className="flex flex-col gap-2.5">
                {legalLinks.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={openCookiePrefs}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-left cursor-pointer"
                  >
                    {f.cookiePrefs}
                  </button>
                </li>
              </ul>
              <p className="text-white font-semibold text-sm mt-6 mb-4">{f.support}</p>
              <a href={`mailto:${f.email}`} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                {f.email}
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-sm">{f.copyright}</p>
            <p className="text-gray-600 text-sm">{f.madeIn}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
