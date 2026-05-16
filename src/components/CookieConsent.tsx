'use client';

// Cookie consent banner (GDPR-compliant).
// Displays on first visit at the bottom of every page. Persists the user's
// choice in localStorage under `peit_cookie_consent` (JSON shape:
//   { necessary: true, functional: bool, analytics: bool, decidedAt: iso }
// ). Necessary cookies cannot be disabled.
//
// Re-opens for adjustment via the global `window.__peit_open_cookie_prefs()`
// (called by the "Cookie Preferences" link in the footer).

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Cookie, X, ShieldCheck, Settings2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { Lang } from '@/lib/i18n';

const STORAGE_KEY = 'peit_cookie_consent';

interface Consent {
  necessary:  true;          // always true — required
  functional: boolean;
  analytics:  boolean;
  decidedAt:  string;        // ISO date
  version:    1;
}

// ─── Hydration detection ──────────────────────────────────────────────────
// useSyncExternalStore returns the server snapshot during SSR / hydration
// and the client snapshot afterwards. Subscribing to nothing is intentional:
// we only care about the first transition, not future updates.
const subscribeNoop = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

// ─── Consent store ────────────────────────────────────────────────────────
// Module-level cache so useSyncExternalStore's getSnapshot returns a stable
// reference between renders — required to avoid infinite-render loops.
let consentCache: { raw: string | null; value: Consent | null } = { raw: null, value: null };

function readConsentSnapshot(): Consent | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch {}
  if (consentCache.raw === raw) return consentCache.value;
  let parsed: Consent | null = null;
  if (raw) {
    try {
      const p = JSON.parse(raw) as Consent;
      if (p?.version === 1 && p?.necessary === true) parsed = p;
    } catch {}
  }
  consentCache = { raw, value: parsed };
  return parsed;
}

function subscribeConsent(cb: () => void): () => void {
  const handler = () => {
    consentCache = { raw: null, value: null }; // invalidate so next read re-parses
    cb();
  };
  window.addEventListener('peit:cookie-consent', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('peit:cookie-consent', handler);
    window.removeEventListener('storage', handler);
  };
}

const COPY: Record<Lang, {
  bannerTitle:   string;
  bannerBody:    string;
  acceptAll:     string;
  rejectAll:     string;
  customize:     string;
  save:          string;
  close:         string;
  managePrefs:   string;
  policyLink:    string;
  categoriesH:   string;
  cat: {
    necessary:  { title: string; desc: string };
    functional: { title: string; desc: string };
    analytics:  { title: string; desc: string };
  };
  always:        string;
}> = {
  ka: {
    bannerTitle: 'cookie-ს გამოყენებას ვითხოვთ თქვენი ნებართვით',
    bannerBody:  'cookie-ს ვიყენებთ ანგარიშისთვის და გამოცდილების გასაუმჯობესებლად. ანალიტიკის ან ფუნქციური cookie-ს ჩართვა შენი არჩევანია.',
    acceptAll:   'ყველას მიღება',
    rejectAll:   'მხოლოდ აუცილებელი',
    customize:   'პერსონალიზაცია',
    save:        'არჩევანის შენახვა',
    close:       'დახურვა',
    managePrefs: 'cookie-ს არჩევანი',
    policyLink:  'სრული პოლიტიკა',
    categoriesH: 'cookie კატეგორიები',
    cat: {
      necessary:  { title: 'აუცილებელი', desc: 'ავტორიზაცია, ენის არჩევანი, უსაფრთხოება. გათიშვა შეუძლებელია.' },
      functional: { title: 'ფუნქციური', desc: 'ჩატ ვიჯეტის visitor ID, საუბრის მდგომარეობა. გაუმჯობესებული გამოცდილებისთვის.' },
      analytics:  { title: 'ანალიტიკა',   desc: 'ანონიმური სტატისტიკა — სად ვაუმჯობესოთ პროდუქტი. პერსონალური ინფორმაცია არ იგზავნება.' },
    },
    always: 'ყოველთვის აქტიური',
  },
  en: {
    bannerTitle: 'We use cookies — with your permission',
    bannerBody:  'We use cookies for account features and to improve your experience. Functional and analytics cookies are your choice.',
    acceptAll:   'Accept all',
    rejectAll:   'Necessary only',
    customize:   'Customise',
    save:        'Save preferences',
    close:       'Close',
    managePrefs: 'Cookie preferences',
    policyLink:  'Full policy',
    categoriesH: 'Cookie categories',
    cat: {
      necessary:  { title: 'Necessary',  desc: 'Authentication, language, security. Cannot be disabled.' },
      functional: { title: 'Functional', desc: 'Chat widget visitor ID, conversation state. Improves the experience.' },
      analytics:  { title: 'Analytics',  desc: 'Anonymous usage stats to improve the product. No personal data is sent.' },
    },
    always: 'Always active',
  },
  ru: {
    bannerTitle: 'Мы используем cookie — с вашего разрешения',
    bannerBody:  'Cookie нужны для функций аккаунта и улучшения опыта. Функциональные и аналитические cookie — на ваш выбор.',
    acceptAll:   'Принять все',
    rejectAll:   'Только необходимые',
    customize:   'Настроить',
    save:        'Сохранить выбор',
    close:       'Закрыть',
    managePrefs: 'Настройки cookie',
    policyLink:  'Полная политика',
    categoriesH: 'Категории cookie',
    cat: {
      necessary:  { title: 'Необходимые',  desc: 'Аутентификация, язык, безопасность. Нельзя отключить.' },
      functional: { title: 'Функциональные', desc: 'Visitor ID чата, состояние диалога. Улучшают опыт.' },
      analytics:  { title: 'Аналитика',    desc: 'Анонимная статистика для улучшения продукта. Личные данные не отправляются.' },
    },
    always: 'Всегда активно',
  },
};

function writeConsent(c: Omit<Consent, 'decidedAt' | 'version' | 'necessary'>): Consent {
  const next: Consent = {
    necessary:  true,
    functional: c.functional,
    analytics:  c.analytics,
    decidedAt:  new Date().toISOString(),
    version:    1,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  // Notify other tabs / listeners.
  try { window.dispatchEvent(new CustomEvent('peit:cookie-consent', { detail: next })); } catch {}
  return next;
}

export default function CookieConsent() {
  const { lang } = useLanguage();
  const t = COPY[lang];

  const isClient = useIsClient();
  const existing = useSyncExternalStore(subscribeConsent, readConsentSnapshot, () => null);

  // `forceOpen` toggles the banner back on after a decision has been made
  // (e.g. when the footer link is clicked).
  const [forceOpen, setForceOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded,  setExpanded]  = useState(false);

  // Pending toggle state: `null` means "show whatever's currently stored",
  // any object overrides until the user saves or cancels. This pattern keeps
  // local UI state derivable from props (no useEffect sync needed).
  const [pending, setPending] = useState<{ functional: boolean; analytics: boolean } | null>(null);
  const effective = pending ?? {
    functional: existing?.functional ?? true,
    analytics:  existing?.analytics  ?? false,
  };
  const functional = effective.functional;
  const analytics  = effective.analytics;

  // Expose a global so the footer "Cookie Preferences" link can re-open.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const open = () => {
      setExpanded(true);
      setForceOpen(true);
      setDismissed(false);
      setPending(null);
    };
    (window as unknown as { __peit_open_cookie_prefs?: () => void }).__peit_open_cookie_prefs = open;
    return () => {
      const w = window as unknown as { __peit_open_cookie_prefs?: () => void };
      if (w.__peit_open_cookie_prefs === open) delete w.__peit_open_cookie_prefs;
    };
  }, []);

  // Show on first visit (no stored choice) OR when re-opened from the footer.
  const visible = isClient && !dismissed && (existing === null || forceOpen);
  if (!visible) return null;

  function setFunctional(v: boolean) {
    setPending({ functional: v, analytics });
  }
  function setAnalytics(v: boolean) {
    setPending({ functional, analytics: v });
  }
  function acceptAll() {
    writeConsent({ functional: true, analytics: true });
    setDismissed(true);
    setForceOpen(false);
    setPending(null);
  }
  function rejectAll() {
    writeConsent({ functional: false, analytics: false });
    setDismissed(true);
    setForceOpen(false);
    setPending(null);
  }
  function savePrefs() {
    writeConsent({ functional, analytics });
    setDismissed(true);
    setForceOpen(false);
    setPending(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="peit-cookie-title"
      className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto z-[60] sm:max-w-md"
    >
      <div className="rounded-2xl border border-white/[0.1] bg-[#0d0d1a]/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25 flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4 text-violet-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p id="peit-cookie-title" className="text-white font-semibold text-sm">
              {t.bannerTitle}
            </p>
          </div>
          <button
            onClick={rejectAll}
            aria-label={t.close}
            className="w-7 h-7 -mt-1 -mr-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-4">
          <p className="text-gray-400 text-[13px] leading-relaxed">
            {t.bannerBody}{' '}
            <Link href="/cookies" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              {t.policyLink}
            </Link>
          </p>
        </div>

        {/* Expanded preferences */}
        {expanded && (
          <div className="px-5 pb-1 border-t border-white/[0.05] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
              {t.categoriesH}
            </p>
            <div className="flex flex-col gap-3">

              <CategoryRow
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                title={t.cat.necessary.title}
                desc={t.cat.necessary.desc}
                value={true}
                disabled
                alwaysLabel={t.always}
                onChange={() => {}}
              />
              <CategoryRow
                title={t.cat.functional.title}
                desc={t.cat.functional.desc}
                value={functional}
                onChange={setFunctional}
              />
              <CategoryRow
                title={t.cat.analytics.title}
                desc={t.cat.analytics.desc}
                value={analytics}
                onChange={setAnalytics}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
          {expanded ? (
            <>
              <button
                onClick={savePrefs}
                className="w-full px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
              >
                {t.save}
              </button>
              <button
                onClick={acceptAll}
                className="w-full px-4 py-2 rounded-xl text-violet-300 hover:text-white text-xs font-medium transition-colors"
              >
                {t.acceptAll}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={rejectAll}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-200 text-sm font-medium transition-colors"
                >
                  {t.rejectAll}
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
                >
                  {t.acceptAll}
                </button>
              </div>
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-medium transition-colors"
              >
                <Settings2 className="w-3 h-3" />
                {t.customize}
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  icon, title, desc, value, disabled, alwaysLabel, onChange,
}: {
  icon?: React.ReactNode;
  title: string;
  desc:  string;
  value: boolean;
  disabled?: boolean;
  alwaysLabel?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 text-white text-[13px] font-semibold">
          {icon}
          {title}
        </div>
        <p className="text-gray-500 text-[11.5px] leading-relaxed">{desc}</p>
      </div>

      {disabled ? (
        <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
          {alwaysLabel}
        </span>
      ) : (
        <button
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
            value ? 'bg-violet-500' : 'bg-white/[0.1]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              value ? 'translate-x-4' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
}
