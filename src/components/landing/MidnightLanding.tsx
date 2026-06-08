'use client';

/* Midnight Signal landing — ported from the design prototype into Next.js.
   Scoped under .ms-root (see src/styles/midnight.css). Wired to the app's
   LanguageContext (ka/en/ru) and Clerk routes. Text "peit" logo kept.
   The nav "try free" button is intentionally removed per request. */

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { useAuth, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useLanguage } from '@/context/LanguageContext';
import { LANDING } from '@/lib/landing-content';
import Logo from '@/components/Logo';

/* ---------- icons ---------- */
const ICONS: Record<string, string> = {
  clock: 'M12 7v5l3 2 M12 21a9 9 0 100-18 9 9 0 000 18z',
  channels: 'M4 6h16 M4 12h10 M4 18h7 M18 14l3 3-3 3',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c2.5 2.5 2.5 15.5 0 18 M12 3c-2.5 2.5-2.5 15.5 0 18',
  lead: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M19 8v6 M22 11h-6',
  chart: 'M4 19V5 M4 19h16 M8 16l3-4 3 2 4-6',
  plug: 'M9 7V3 M15 7V3 M7 7h10v4a5 5 0 01-10 0V7z M12 16v5',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  arrowUpRight: 'M7 17L17 7 M8 7h9v9',
  check: 'M5 12l5 5L20 7',
  star: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z',
  spark: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M18 6l-2.5 2.5 M8.5 15.5L6 18',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  x: 'M6 6l12 12 M18 6L6 18',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v3 M12 20v3 M4 12H1 M23 12h-3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2',
  moon: 'M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z',
  tg: 'M22 4L2 11l6 2 2 7 3-4 5 4 4-16z M8 13l9-6',
  ig: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4z M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z M17 6.5h.01',
  web: 'M3 9h18 M9 21V9 M12 3a9 9 0 100 18 9 9 0 000-18z',
};
function Icon({ name, size = 22, sw = 1.6, style }: { name: string; size?: number; sw?: number; style?: CSSProperties }) {
  const d = ICONS[name] || ICONS.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {d.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}

/* ---------- scroll reveal ---------- */
function useReveal() {
  useEffect(() => {
    let raf = 0;
    // Opt into the hidden-then-animate behaviour only now that JS runs.
    // Until .reveal-ready is present, all [data-reveal] content stays visible,
    // so a JS/hydration failure can never blank out or freeze the page.
    const root = document.querySelector('.ms-root');
    root?.classList.add('reveal-ready');
    const reveal = (el: Element) => {
      el.classList.add('in');
      setTimeout(() => el.classList.add('rv-done'), 820);
    };
    const check = () => {
      raf = 0;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll('.ms-root [data-reveal]:not(.in)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > -40) reveal(el);
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    const timers = [0, 80, 200, 400, 700, 1100, 1600].map(d => window.setTimeout(check, d));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      timers.forEach(clearTimeout); if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const m = String(value).match(/([\d.]+)/);
    if (!m || m.index === undefined) { el.textContent = value; return; }
    const target = parseFloat(m[1]);
    const prefix = value.slice(0, m.index), suffix = value.slice(m.index + m[1].length);
    const dec = (m[1].split('.')[1] || '').length;
    let started = false;
    const run = () => {
      started = true;
      const dur = 1100, t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const check = () => {
      if (started) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.9 && r.bottom > 0) { run(); window.removeEventListener('scroll', check); }
    };
    check();
    const tm = window.setTimeout(check, 200);
    window.addEventListener('scroll', check, { passive: true });
    return () => { window.removeEventListener('scroll', check); clearTimeout(tm); };
  }, [value]);
  return <span ref={ref} className={className}>{value}</span>;
}

/* ---------- chat demo (fixed-height card — never overflows below) ---------- */
function ChatDemo({ t }: { t: any }) {
  const msgs: { who: string; t: string }[] = t.chat.msgs;
  const [shown, setShown] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: number[] = [];
    let cancelled = false;
    function run() {
      setShown([]); setTyping(false);
      let delay = 600;
      msgs.forEach((m, i) => {
        if (m.who === 'bot') {
          timers.push(window.setTimeout(() => { if (!cancelled) setTyping(true); }, delay));
          delay += 900;
        }
        timers.push(window.setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          setShown(s => [...s, i]);
        }, delay));
        delay += m.who === 'bot' ? 700 : 1100;
      });
      timers.push(window.setTimeout(() => { if (!cancelled) run(); }, delay + 3200));
    }
    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [t]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [shown, typing]);

  return (
    <div className="chat-card" data-reveal data-delay="2">
      <div className="chat-top">
        <div className="chat-id">
          <span className="chat-ava"><span className="ava-logo">pe<span className="ava-logo-i">i</span>t</span></span>
          <div>
            <div className="chat-name">{t.chat.name}</div>
            <div className="chat-status"><span className="dot-live" />{t.chat.status}</div>
          </div>
        </div>
        <span className="pill mono" style={{ fontSize: 11, padding: '5px 10px' }}>{t.chat.avg}</span>
      </div>
      <div className="chat-body" ref={boxRef}>
        {msgs.map((m, i) => shown.includes(i) && (
          <div key={i} className={'bubble-row ' + m.who}>
            {m.who === 'bot' && <span className="bubble-ava"><span className="ava-logo-sm">p</span></span>}
            <div className={'bubble ' + m.who}>{m.t}</div>
          </div>
        ))}
        {typing && (
          <div className="bubble-row bot">
            <span className="bubble-ava"><span className="ava-logo-sm">p</span></span>
            <div className="bubble bot typing"><span /><span /><span /></div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <span className="chat-input-text">{t.chat.placeholder}</span>
        <span className="chat-send"><Icon name="send" size={16} sw={1.8} /></span>
      </div>
    </div>
  );
}

function Hero({ t, ctaHref }: { t: any; ctaHref: string }) {
  const stats = [
    { v: t.hero.stat1, l: t.hero.stat1l },
    { v: t.hero.stat2, l: t.hero.stat2l },
    { v: t.hero.stat3, l: t.hero.stat3l },
  ];
  return (
    <section className="hero">
      <div className="glow" style={{ width: 620, height: 620, top: -260, left: '52%', background: 'radial-gradient(circle, var(--glow-a), transparent 70%)' }} />
      <div className="glow" style={{ width: 460, height: 460, top: 60, left: '8%', background: 'radial-gradient(circle, var(--glow-b), transparent 70%)', opacity: 0.6 }} />
      <div className="wrap hero-grid">
        <div className="hero-left">
          <span className="hero-badge" data-reveal>
            <span className="dot-live" />{t.hero.badge}
          </span>
          <h1 className="h-display" data-reveal data-delay="1">
            <span>{t.hero.title1}</span><br />
            <span className="text-grad">{t.hero.title2}</span>
          </h1>
          <p className="lede" data-reveal data-delay="2" style={{ marginTop: 22 }}>{t.hero.sub}</p>
          <div className="hero-cta" data-reveal data-delay="3">
            <Link href={ctaHref} className="btn btn-primary btn-lg">{t.hero.cta1}<Icon name="arrow" size={18} sw={2} /></Link>
          </div>
          <div className="hero-note mono" data-reveal data-delay="4">{t.hero.note}</div>
          <div className="hero-stats" data-reveal data-delay="4">
            {stats.map((s, i) => (
              <div className="hero-stat" key={i}>
                <CountUp value={s.v} className="hero-stat-v mono" />
                <span className="hero-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-right">
          <ChatDemo t={t} />
          <div className="hero-chips">
            <span className="chip"><Icon name="web" size={14} sw={1.8} /> Web</span>
            <span className="chip"><Icon name="tg" size={14} sw={1.8} /> Telegram</span>
            <span className="chip"><Icon name="ig" size={14} sw={1.8} /> Instagram</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof({ t }: { t: any }) {
  const logos: string[] = [...t.social.logos, ...t.social.logos];
  return (
    <section className="social">
      <div className="wrap">
        <div className="social-head" data-reveal>
          <div className="social-trust">
            <div className="avatars">
              {['SM', 'DC', 'MR', 'AK', 'LW', 'PS'].map((a, i) => <span key={i} className="ava-sm" style={{ zIndex: 6 - i }}>{a}</span>)}
            </div>
            <div>
              <div className="social-trust-t">{t.social.trust}</div>
              <div className="social-trust-s">{t.social.sub}</div>
            </div>
          </div>
          <div className="social-rating">
            <div className="stars">{[0, 1, 2, 3, 4].map(i => <Icon key={i} name="star" size={16} sw={1.4} style={{ fill: 'var(--accent-bright)', color: 'var(--accent-bright)' }} />)}</div>
            <span className="rating-v mono">{t.social.rating}</span>
            <span className="rating-n">{t.social.ratingNote}</span>
          </div>
        </div>
        <div className="marquee-wrap" data-reveal>
          <div className="marquee">
            {logos.map((l, i) => <span key={i} className="marquee-logo">{l}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) { return <span className="kicker">{children}</span>; }
function SectionHead({ kicker, title, sub, center }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={'sec-head' + (center ? ' center' : '')} data-reveal>
      <Kicker>{kicker}</Kicker>
      <h2 className="h-section" style={{ marginTop: 18 }}>{title}</h2>
      {sub && <p className="lede" style={{ marginTop: 16, marginInline: center ? 'auto' : 0 }}>{sub}</p>}
    </div>
  );
}

const FEAT_ICONS = ['clock', 'channels', 'globe', 'lead', 'chart', 'plug', 'bolt', 'shield'];
function Features({ t }: { t: any }) {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <SectionHead kicker={t.features.kicker} title={t.features.title} sub={t.features.sub} />
        <div className="feat-grid" style={{ marginTop: 56 }}>
          {t.features.items.map((f: any, i: number) => (
            <div className="feat-card card" key={i} data-reveal data-delay={(i % 4) + 1}>
              <span className="feat-ico"><Icon name={FEAT_ICONS[i]} size={22} sw={1.6} /></span>
              <h3 className="feat-t">{f.t}</h3>
              <p className="feat-d">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: any }) {
  return (
    <section className="section how" id="how">
      <div className="glow" style={{ width: 500, height: 500, top: '20%', right: '-10%', background: 'radial-gradient(circle, var(--glow-a), transparent 70%)', opacity: 0.4 }} />
      <div className="wrap">
        <SectionHead kicker={t.how.kicker} title={t.how.title} sub={t.how.sub} center />
        <div className="how-grid" style={{ marginTop: 64 }}>
          {t.how.steps.map((s: any, i: number) => (
            <div className="how-step" key={i} data-reveal data-delay={i + 1}>
              <div className="how-num mono">0{i + 1}</div>
              <h3 className="how-t">{s.t}</h3>
              <p className="how-d">{s.d}</p>
              <div className="how-note"><Icon name="check" size={15} sw={2} />{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Industries({ t, ctaHref }: { t: any; ctaHref: string }) {
  return (
    <section className="section" id="industries">
      <div className="wrap">
        <SectionHead kicker={t.industries.kicker} title={t.industries.title} sub={t.industries.sub} />
        <div className="ind-grid" style={{ marginTop: 56 }}>
          {t.industries.items.map((it: any, i: number) => (
            <Link href={ctaHref} className="ind-card card" key={i} data-reveal data-delay={(i % 4) + 1}>
              <div className="ind-top">
                <span className="ind-name">{it.t}</span>
                <span className="ind-arrow"><Icon name="arrowUpRight" size={16} sw={1.8} /></span>
              </div>
              <p className="ind-d">{it.d}</p>
              <span className="ind-metric mono">{it.m}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ t }: { t: any }) {
  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <SectionHead kicker={t.testimonials.kicker} title={t.testimonials.title} sub={t.testimonials.sub} />
        <div className="testi-grid" style={{ marginTop: 56 }}>
          {t.testimonials.items.map((it: any, i: number) => (
            <figure className="testi-card card" key={i} data-reveal data-delay={i + 1}>
              <span className="testi-metric mono">{it.metric}</span>
              <blockquote className="testi-quote">{it.quote}</blockquote>
              <figcaption className="testi-foot">
                <span className="testi-ava">{it.in}</span>
                <span>
                  <span className="testi-who">{it.who}</span>
                  <span className="testi-role">{it.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="testi-join mono" data-reveal>{t.testimonials.join}</div>
      </div>
    </section>
  );
}

function Pricing({ t, ctaHref }: { t: any; ctaHref: string }) {
  return (
    <section className="section pricing" id="pricing">
      <div className="wrap">
        <SectionHead kicker={t.pricing.kicker} title={t.pricing.title} sub={t.pricing.sub} center />
        <div className="compare" data-reveal>
          <div className="compare-side dim">
            <span className="compare-l">{t.pricing.compareA}</span>
            <span className="compare-p mono">{t.pricing.compareAp}</span>
          </div>
          <span className="compare-vs mono">{t.pricing.vs}</span>
          <div className="compare-side hi">
            <span className="compare-l">{t.pricing.compareB}</span>
            <span className="compare-p mono">{t.pricing.compareBp}</span>
          </div>
        </div>
        <div className="plan-grid" style={{ marginTop: 48 }}>
          {t.pricing.plans.map((p: any, i: number) => (
            <div className={'plan card' + (p.popular ? ' popular' : '') + (p.enterprise ? ' enterprise' : '')} key={i} data-reveal data-delay={(i % 4) + 1}>
              {p.popular && <span className="plan-badge mono">{t.pricing.popular}</span>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                <span className="plan-p mono">{p.price}</span>
                {p.per && <span className="plan-per">{p.per}</span>}
              </div>
              {p.trial && <div className="plan-trial mono">{p.trial}</div>}
              <p className="plan-desc">{p.desc}</p>
              <Link href={ctaHref} className={'btn ' + (p.popular ? 'btn-primary' : 'btn-ghost')} style={{ width: '100%' }}>{p.cta}</Link>
              <div className="rule" style={{ margin: '22px 0 18px' }} />
              <ul className="plan-feats">
                {p.feats.map((f: string, j: number) => (
                  <li key={j}><Icon name="check" size={15} sw={2} style={{ color: 'var(--accent-bright)', flexShrink: 0 }} />{f}</li>
                ))}
              </ul>
              {!p.enterprise && <div className="plan-cancel">{t.pricing.cancel}</div>}
            </div>
          ))}
        </div>
        <div className="pay-note mono" data-reveal>{t.pricing.pay}</div>
      </div>
    </section>
  );
}

function FinalCTA({ t, ctaHref }: { t: any; ctaHref: string }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="final-cta" data-reveal>
          <div className="glow" style={{ width: 520, height: 360, top: '-30%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, var(--glow-a), transparent 70%)', opacity: 0.5 }} />
          <h2 className="h-section final-title">
            {t.finalCta.title1}<br /><span className="text-grad">{t.finalCta.title2}</span>
          </h2>
          <p className="lede" style={{ marginInline: 'auto', marginTop: 18 }}>{t.finalCta.sub}</p>
          <Link href={ctaHref} className="btn btn-primary btn-lg" style={{ marginTop: 30 }}>{t.finalCta.cta}<Icon name="arrow" size={18} sw={2} /></Link>
          <div className="hero-note mono" style={{ marginTop: 18 }}>{t.finalCta.note}</div>
          <div className="final-join">{t.finalCta.join}</div>
        </div>
      </div>
    </section>
  );
}

function FAQ({ t }: { t: any }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq" id="faq">
      <div className="wrap faq-wrap">
        <div className="faq-head" data-reveal>
          <Kicker>{t.faq.kicker}</Kicker>
          <h2 className="h-section" style={{ marginTop: 18 }}>{t.faq.title}</h2>
          <p className="text-muted" style={{ marginTop: 16 }}>{t.faq.note} <a href="mailto:info@peit.ge" className="text-accent">{t.faq.noteLink}</a></p>
        </div>
        <div className="faq-list" data-reveal data-delay="1">
          {t.faq.items.map((it: any, i: number) => (
            <div className={'faq-item' + (open === i ? ' open' : '')} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span>{it.q}</span>
                <span className="faq-plus"><Icon name="arrow" size={18} sw={2} /></span>
              </button>
              <div className="faq-a"><p>{it.a}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- nav (text logo, no try-free button) ---------- */
const LANGS: { code: 'ka' | 'en' | 'ru'; label: string }[] = [
  { code: 'ka', label: 'ქარ' }, { code: 'en', label: 'EN' }, { code: 'ru', label: 'RU' },
];
function MarketingNav({ t, theme, toggleTheme }: { t: any; theme: 'dark' | 'light'; toggleTheme: () => void }) {
  const { lang, setLang } = useLanguage();
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  // All nav targets are in-page sections — they scroll, never open a
  // separate route. (Blog removed entirely.)
  const links = [
    { label: t.nav.how, href: '#how' },
    { label: t.nav.pricing, href: '#pricing' },
    { label: t.nav.industries, href: '#industries' },
  ];
  return (
    <header className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="wrap nav-inner">
        <Logo
          size="md"
          onClick={(e) => {
            // Already on the landing — smooth-scroll to top instead of reloading.
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
        <nav className="nav-links">
          {links.map(l => (
            l.href.startsWith('#')
              ? <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
              : <Link key={l.label} href={l.href} className="nav-link">{l.label}</Link>
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
          {/* Auth-aware: signed-in visitors get Dashboard + their account
              button, NOT a "Sign in" link (which would just bounce them
              home since they're already authenticated). */}
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="nav-link nav-signin">{t.nav.dashboard}</Link>
              <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
            </>
          ) : (
            <>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button type="button" className="nav-link nav-signin">{t.nav.signin}</button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button type="button" className="nav-signup">{t.nav.signup}</button>
              </SignUpButton>
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
            l.href.startsWith('#')
              ? <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
              : <Link key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          {isSignedIn
            ? <Link href="/dashboard" onClick={() => setOpen(false)}>{t.nav.dashboard}</Link>
            : <>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button type="button" onClick={() => setOpen(false)}>{t.nav.signin}</button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button type="button" className="nav-signup" onClick={() => setOpen(false)}>{t.nav.signup}</button>
                </SignUpButton>
              </>}
        </div>
      )}
    </header>
  );
}

function MarketingFooter({ t }: { t: any }) {
  // In-page anchors for product/industries (no separate routes, no blog);
  // legal links stay as real pages. Blog item dropped from the product list.
  const productItems = (t.footer.product as string[]).slice(0, 3); // drop "blog"
  const cols = [
    { h: t.footer.colProduct, items: productItems,
      hrefs: ['#features', '#pricing', '#how'] },
    { h: t.footer.colIndustries, items: t.footer.industries,
      hrefs: ['#industries', '#industries', '#industries', '#industries', '#industries', '#industries'] },
    { h: t.footer.colLegal, items: t.footer.legal,
      hrefs: ['/terms', '/privacy', '/gdpr', '/cookies'] },
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo size="md" />
            <p className="text-muted" style={{ maxWidth: '34ch', marginTop: 16, fontSize: 15 }}>{t.footer.tagline}</p>
            <a href="mailto:info@peit.ge" className="footer-mail mono">info@peit.ge</a>
          </div>
          {cols.map((c: any, i: number) => (
            <div key={i} className="footer-col">
              <div className="footer-h">{c.h}</div>
              {c.items.map((it: string, j: number) => {
                const href = c.hrefs[j] ?? '#';
                return href.startsWith('#')
                  ? <a key={j} href={href} className="footer-link">{it}</a>
                  : <Link key={j} href={href} className="footer-link">{it}</Link>;
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

export default function MidnightLanding() {
  const { lang } = useLanguage();
  const { isSignedIn } = useAuth();
  const t: any = LANDING[lang] ?? LANDING.ka;
  useReveal();

  // Light / dark theme — persisted, applied to .ms-root via data-theme.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('peit-theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch { /* no-op */ }
  }, []);
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('peit-theme', next); } catch { /* no-op */ }
      return next;
    });
  };

  // In-page anchor links scroll smoothly with an offset for the fixed nav,
  // instead of jumping (or opening a route).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    const root = document.querySelector('.ms-root');
    root?.addEventListener('click', onClick as EventListener);
    return () => root?.removeEventListener('click', onClick as EventListener);
  }, []);

  // Signed-in visitors should land in the dashboard, not /signup (which
  // bounces them home since they're already authenticated).
  const ctaHref = isSignedIn ? '/dashboard' : '/signup';
  return (
    <div className="ms-root" data-theme={theme}>
      <div className="bg-grid" />
      <MarketingNav t={t} theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero t={t} ctaHref={ctaHref} />
        <SocialProof t={t} />
        <Features t={t} />
        <HowItWorks t={t} />
        <Industries t={t} ctaHref={ctaHref} />
        <Testimonials t={t} />
        <Pricing t={t} ctaHref={ctaHref} />
        <FinalCTA t={t} ctaHref={ctaHref} />
        <FAQ t={t} />
      </main>
      <MarketingFooter t={t} />
    </div>
  );
}
