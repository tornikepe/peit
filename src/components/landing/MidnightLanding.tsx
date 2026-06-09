'use client';

/* Midnight Signal landing — ported from the design prototype into Next.js.
   Scoped under .ms-root (see src/styles/midnight.css). Wired to the app's
   LanguageContext (ka/en/ru) and Clerk routes. Text "peit" logo kept.
   The nav "try free" button is intentionally removed per request. */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from '@/context/LanguageContext';
import { LANDING, type LandingContent } from '@/lib/landing-content';
import { Icon } from './Icon';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

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
function ChatDemo({ t }: { t: LandingContent }) {
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

function Hero({ t, ctaHref }: { t: LandingContent; ctaHref: string }) {
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
function Features({ t }: { t: LandingContent }) {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <SectionHead kicker={t.features.kicker} title={t.features.title} sub={t.features.sub} />
        <div className="feat-grid" style={{ marginTop: 56 }}>
          {t.features.items.map((f, i) => (
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

function HowItWorks({ t }: { t: LandingContent }) {
  return (
    <section className="section how" id="how">
      <div className="glow" style={{ width: 500, height: 500, top: '20%', right: '-10%', background: 'radial-gradient(circle, var(--glow-a), transparent 70%)', opacity: 0.4 }} />
      <div className="wrap">
        <SectionHead kicker={t.how.kicker} title={t.how.title} sub={t.how.sub} center />
        <div className="how-grid" style={{ marginTop: 64 }}>
          {t.how.steps.map((s, i) => (
            <div className="how-step" key={i} data-reveal data-delay={i + 1}>
              <div className="how-num mono">0{i + 1}</div>
              <h3 className="how-t">{s.t}</h3>
              <p className="how-d">{s.d}</p>
              {s.note && <div className="how-note"><Icon name="check" size={15} sw={2} />{s.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Industries({ t }: { t: LandingContent }) {
  return (
    <section className="section" id="industries">
      <div className="wrap">
        <SectionHead kicker={t.industries.kicker} title={t.industries.title} sub={t.industries.sub} />
        <div className="ind-grid" style={{ marginTop: 56 }}>
          {t.industries.items.map((it, i) => (
            <div className="ind-card card" key={i} data-reveal data-delay={(i % 4) + 1}>
              <div className="ind-top">
                <span className="ind-name">{it.t}</span>
              </div>
              <p className="ind-d">{it.d}</p>
              <span className="ind-metric mono">{it.m}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ t }: { t: LandingContent }) {
  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <SectionHead kicker={t.testimonials.kicker} title={t.testimonials.title} sub={t.testimonials.sub} />
        <div className="testi-grid" style={{ marginTop: 56 }}>
          {t.testimonials.items.map((it, i) => (
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

function Pricing({ t, ctaHref }: { t: LandingContent; ctaHref: string }) {
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
          {t.pricing.plans.map((p, i) => (
            <div className={'plan card' + (p.popular ? ' popular' : '') + (p.enterprise ? ' enterprise' : '')} key={i} data-reveal data-delay={(i % 4) + 1}>
              {p.popular && <span className="plan-badge mono">{t.pricing.popular}</span>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                <span className="plan-p mono">{p.price}</span>
                {p.per && <span className="plan-per">{p.per}</span>}
              </div>
              {p.trial && <div className="plan-trial mono">{p.trial}</div>}
              <p className="plan-desc">{p.desc}</p>
              {p.enterprise ? (
                // Enterprise: open an email to the sales inbox instead of routing.
                <a href="mailto:info@peit.ge?subject=Peit%20Enterprise" className="btn btn-ghost" style={{ width: '100%' }}>{p.cta}</a>
              ) : (
                // Signed-in visitors go to billing (manage / upgrade), never the
                // dashboard home; logged-out visitors start sign-up.
                <Link href={ctaHref === '/dashboard' ? '/dashboard/billing' : ctaHref} className={'btn ' + (p.popular ? 'btn-primary' : 'btn-ghost')} style={{ width: '100%' }}>{p.cta}</Link>
              )}
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

function FinalCTA({ t, ctaHref }: { t: LandingContent; ctaHref: string }) {
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

function FAQ({ t }: { t: LandingContent }) {
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
          {t.faq.items.map((it, i) => (
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


export default function MidnightLanding() {
  const { lang } = useLanguage();
  const { isSignedIn } = useAuth();
  // Russian was removed — anything other than 'en' (incl. a stale 'ru') uses ka.
  const t: LandingContent = lang === 'en' ? LANDING.en : LANDING.ka;
  useReveal();

  // Theme is owned by the shared MarketingNav (it applies data-theme to every
  // .ms-root + <html>), so the landing and the legal pages stay in sync.

  // Signed-in visitors should land in the dashboard, not /signup (which
  // bounces them home since they're already authenticated).
  const ctaHref = isSignedIn ? '/dashboard' : '/signup';
  return (
    <div className="ms-root">
      <div className="bg-grid" />
      <MarketingNav />
      <main>
        <Hero t={t} ctaHref={ctaHref} />
        <Features t={t} />
        <HowItWorks t={t} />
        <Industries t={t} />
        <Testimonials t={t} />
        <Pricing t={t} ctaHref={ctaHref} />
        <FinalCTA t={t} ctaHref={ctaHref} />
        <FAQ t={t} />
      </main>
      <MarketingFooter />
    </div>
  );
}
