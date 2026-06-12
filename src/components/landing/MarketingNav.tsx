'use client';

// Shared marketing header — used on the landing AND the legal pages so they all
// get the same, working nav (the old Navbar linked to removed routes). Owns the
// light/dark theme (persisted) and applies it to every .ms-root + <html> so the
// Clerk auth modal follows. Nav links point at homepage sections: on the home
// page they smooth-scroll; from any other page they navigate home + anchor.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import UserMenu from '@/components/auth/UserMenu';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { useLanguage } from '@/context/LanguageContext';
import { LANDING } from '@/lib/landing-content';
import Logo from '@/components/Logo';
import { Icon } from './Icon';

const LANGS: { code: 'ka' | 'en'; label: string }[] = [
  { code: 'ka', label: 'ქარ' }, { code: 'en', label: 'EN' },
];

function applyTheme(theme: 'dark' | 'light') {
  document.querySelectorAll('.ms-root').forEach(el => ((el as HTMLElement).dataset.theme = theme));
  document.documentElement.dataset.theme = theme;
}

/** Smooth-scroll to a homepage section with an offset for the fixed nav. */
function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 76, behavior: 'smooth' });
}

export default function MarketingNav() {
  const { lang, setLang } = useLanguage();
  const { isSignedIn } = useAuth();
  const { open: openAuth } = useAuthModal();
  const t = lang === 'en' ? LANDING.en : LANDING.ka;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('peit-theme');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch { /* no-op */ }
  }, []);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggleTheme = () => setTheme(prev => {
    const next = prev === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('peit-theme', next); } catch { /* no-op */ }
    return next;
  });

  const links = [
    { label: t.nav.how, id: 'how' },
    { label: t.nav.pricing, id: 'pricing' },
    { label: t.nav.industries, id: 'industries' },
  ];

  // When we land back on the homepage from another page, scroll to the section
  // the user asked for — kept in sessionStorage so the URL stays clean ("/"
  // instead of "/#how").
  useEffect(() => {
    if (pathname !== '/') return;
    let target: string | null = null;
    try { target = sessionStorage.getItem('peit-scroll'); sessionStorage.removeItem('peit-scroll'); } catch { /* ignore */ }
    if (target) setTimeout(() => scrollToSection(target!), 60);
  }, [pathname]);

  function onAnchor(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setOpen(false);
    if (pathname === '/') {
      scrollToSection(id);
    } else {
      // From another page: go home cleanly (no #hash) and scroll after load.
      try { sessionStorage.setItem('peit-scroll', id); } catch { /* ignore */ }
      router.push('/');
    }
  }

  return (
    <header className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="wrap nav-inner">
        <Logo
          size="md"
          onClick={(e) => {
            if (pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
          }}
        />
        <nav className="nav-links">
          {links.map(l => (
            <Link key={l.id} href={`/#${l.id}`} className="nav-link" onClick={(e) => onAnchor(e, l.id)}>{l.label}</Link>
          ))}
        </nav>
        <div className="nav-actions">
          <div className="lang-toggle" role="group" aria-label="Language">
            {LANGS.map(l => (
              <button key={l.code} type="button" onClick={() => setLang(l.code)} className={'lang-opt' + (lang === l.code ? ' on' : '')}>{l.label}</button>
            ))}
          </div>
          <button type="button" className="seg-toggle" onClick={toggleTheme} aria-label="Toggle theme" title="Theme">
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={17} sw={1.7} />
          </button>
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="nav-link nav-signin">{t.nav.dashboard}</Link>
              <UserMenu />
            </>
          ) : (
            <>
              <button type="button" onClick={() => openAuth('signin')} className="nav-link nav-signin">{t.nav.signin}</button>
              <button type="button" onClick={() => openAuth('signup')} className="nav-signup">{t.nav.signup}</button>
            </>
          )}
          <button className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
            <Icon name={open ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-mobile">
          {links.map(l => (
            <Link key={l.id} href={`/#${l.id}`} onClick={(e) => onAnchor(e, l.id)}>{l.label}</Link>
          ))}
          {isSignedIn
            ? <Link href="/dashboard" onClick={() => setOpen(false)}>{t.nav.dashboard}</Link>
            : <>
                <button type="button" onClick={() => { setOpen(false); openAuth('signin'); }}>{t.nav.signin}</button>
                <button type="button" className="nav-signup" onClick={() => { setOpen(false); openAuth('signup'); }}>{t.nav.signup}</button>
              </>}
        </div>
      )}
    </header>
  );
}
