'use client';

import Link from "next/link";
import { Zap, Mail } from "lucide-react";
import { industries } from "./Industries";
import { useLanguage } from "@/context/LanguageContext";

const alternativeLinks = [
  { labelKey: 'Tidio ალტერნატივა', href: '/alternatives/tidio' },
  { labelKey: 'Drift ალტერნატივა',  href: '/alternatives/drift'  },
  { labelKey: 'Intercom ალტერნატივა', href: '/alternatives/intercom' },
];

export default function Footer() {
  const { t } = useLanguage();
  const f = t.footer;

  const productLinks = [
    { label: f.features,    href: '/#features'    },
    { label: f.pricing,     href: '/pricing'       },
    { label: f.howItWorks,  href: '/how-it-works'  },
    { label: f.blog,        href: '/blog'          },
    ...alternativeLinks.map(l => ({ label: l.labelKey, href: l.href })),
  ];

  const legalLinks = [
    { label: f.terms,   href: '/terms'   },
    { label: f.privacy, href: '/privacy' },
  ];

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
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-white text-lg">Peit</span>
              </Link>
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
