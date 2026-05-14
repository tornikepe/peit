'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/lib/i18n";

const languages: { code: Lang; label: string; flag: string }[] = [
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺' },
];

export default function Navbar() {
  const [open, setOpen]       = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { isSignedIn }        = useAuth();
  const { lang, setLang, t }  = useLanguage();

  const activeLang = languages.find(l => l.code === lang) ?? languages[0];

  const navLinks = [
    { label: t.nav.howItWorks, href: '/how-it-works' },
    { label: t.nav.pricing,    href: '/pricing' },
    { label: t.nav.industries, href: '/#industries' },
    { label: t.nav.blog,       href: '/blog' },
  ];

  return (
    <header className="fixed top-3 left-3 right-3 sm:top-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 w-auto sm:w-[min(72rem,calc(100%-2rem))]">
      <div className="rounded-2xl border border-white/[0.08] bg-[#07070f]/75 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] px-4 sm:px-6 flex items-center justify-between h-14">

        {/* Logo — text-based with accent letter (matches peit-redesign reference) */}
        <Link
          href="/"
          className="font-extrabold text-white text-2xl tracking-[-0.04em] leading-none cursor-pointer transition-transform hover:-translate-y-px"
          aria-label="Peit"
        >
          pe<span className="gradient-text">i</span>t
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              <span className="text-base leading-none">{activeLang.flag}</span>
              <span className="uppercase text-xs font-semibold">{activeLang.code}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <>
                {/* click-away overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#0d0d1a] border border-white/[0.08] rounded-xl shadow-2xl py-1.5 min-w-[150px] z-50">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        lang === l.code
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Auth */}
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
              >
                {t.nav.dashboard}
              </Link>
              <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-sm font-medium text-white px-5 py-2 rounded-lg"
              >
                {t.nav.tryFree}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setOpen(v => !v)}
          aria-label="მენიუ"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu — sits inside the same pill, looks continuous */}
      {open && (
        <div className="md:hidden mt-2 rounded-2xl border border-white/[0.08] bg-[#07070f]/95 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] px-3 py-3 flex flex-col gap-1.5">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/[0.05] transition-all"
            >
              {link.label}
            </Link>
          ))}

          {/* Language switcher — mobile */}
          <div className="border-t border-white/[0.06] mt-2 pt-4">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold px-4 mb-2">ენა / Language</p>
            <div className="flex gap-2 px-2">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    lang === l.code
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span>{l.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.06] mt-2 pt-4 flex flex-col gap-2">
            {isSignedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm text-gray-300 text-center rounded-lg hover:bg-white/[0.05]">
                  {t.nav.dashboard}
                </Link>
                <div className="flex justify-center py-2"><UserButton /></div>
              </>
            ) : (
              <>
                <Link href="/signin" onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm text-gray-400 text-center rounded-lg hover:bg-white/[0.05]">
                  {t.nav.signIn}
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}
                  className="btn-primary text-sm font-medium text-white text-center px-4 py-3 rounded-lg">
                  {t.nav.tryFree}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
