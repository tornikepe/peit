'use client';

// Shared marketing footer — used on the landing and the legal pages. Product /
// industries links point at homepage sections (absolute "/#id" so they work
// from any page); legal links are real pages.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LANDING } from '@/lib/landing-content';
import Logo from '@/components/Logo';

export default function MarketingFooter() {
  const { lang } = useLanguage();
  const t = lang === 'en' ? LANDING.en : LANDING.ka;
  const pathname = usePathname();
  const router = useRouter();

  const productItems = (t.footer.product as string[]).slice(0, 3); // drop "blog"
  const cols = [
    { h: t.footer.colProduct, items: productItems, hrefs: ['/#features', '/#pricing', '/#how'] },
    { h: t.footer.colIndustries, items: t.footer.industries,
      hrefs: t.footer.industries.map(() => '/#industries') },
    { h: t.footer.colLegal, items: t.footer.legal, hrefs: ['/terms', '/privacy', '/gdpr', '/cookies'] },
  ];

  function onAnchor(e: React.MouseEvent, href: string) {
    if (!href.startsWith('/#')) return; // legal pages navigate normally
    const id = href.slice(2);
    e.preventDefault();
    if (pathname === '/') {
      const target = document.getElementById(id);
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 76, behavior: 'smooth' });
    } else {
      // From another page: go home cleanly and scroll there (no #hash in URL).
      try { sessionStorage.setItem('peit-scroll', id); } catch { /* ignore */ }
      router.push('/');
    }
  }

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo size="md" />
            <p className="text-muted" style={{ maxWidth: '34ch', marginTop: 16, fontSize: 15 }}>{t.footer.tagline}</p>
            <a href="mailto:info@peit.ge" className="footer-mail mono">info@peit.ge</a>
          </div>
          {cols.map((c, i) => (
            <div key={i} className="footer-col">
              <div className="footer-h">{c.h}</div>
              {c.items.map((it: string, j: number) => {
                const href = c.hrefs[j] ?? '/';
                return (
                  <Link key={j} href={href} className="footer-link" onClick={(e) => onAnchor(e, href)}>{it}</Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="text-faint mono" style={{ fontSize: 13 }}>{t.footer.copy}</span>
          <span className="text-faint" style={{ fontSize: 13 }}>{t.footer.made}</span>
        </div>
      </div>
    </footer>
  );
}
