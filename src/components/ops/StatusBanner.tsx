'use client';

// Lightweight client-side health probe. On first load it pings /api/health
// once; if the service is down (non-200) or slow (>3s), it shows a localized
// "service is slow" banner. The result is cached in sessionStorage for 60s so
// route changes don't spam the endpoint.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const CACHE_KEY = 'peit_health';
const CACHE_MS  = 60_000;

type Lang = 'ka' | 'en' | 'ru';
const COPY: Record<Lang, string> = {
  ka: 'სერვისი ნელა მუშაობს — ვმუშაობთ გამოსასწორებლად',
  en: 'The service is running slowly — we’re working on it',
  ru: 'Сервис работает медленно — мы уже работаем над этим',
};

function pickLang(): Lang {
  if (typeof document === 'undefined') return 'ka';
  const l = (document.documentElement.lang || 'ka').slice(0, 2);
  return (l === 'en' || l === 'ru') ? l : 'ka';
}

export default function StatusBanner() {
  const [degraded, setDegraded] = useState(false);
  const pathname = usePathname();
  // The embeddable widget runs inside customers' sites — never probe health or
  // show our status banner there.
  const onWidget = pathname?.startsWith('/widget');

  useEffect(() => {
    if (onWidget) return;
    let cancelled = false;

    // Honor a fresh cached verdict to avoid re-probing on every navigation.
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null') as
        | { at: number; degraded: boolean } | null;
      if (cached && Date.now() - cached.at < CACHE_MS) {
        // Intentional: apply the cached verdict on mount (client-only).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDegraded(cached.degraded);
        return;
      }
    } catch { /* ignore */ }

    // Only flag a genuine outage: /api/health returns 503 when the database
    // is down (status "down"). A healthy-but-cold response is 200 — we must
    // NOT scare users on a normal cold start, so latency is not a trigger.
    fetch('/api/health', { cache: 'no-store' })
      .then(async res => {
        let down = !res.ok;
        try { const j = await res.json(); down = down || j?.status === 'down'; } catch { /* keep res.ok verdict */ }
        if (!cancelled) {
          setDegraded(down);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), degraded: down })); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* network error from the client side — don't assume the service is down */ });

    return () => { cancelled = true; };
  }, [onWidget]);

  if (onWidget || !degraded) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-amber-400 text-black text-center text-xs py-1.5 px-3 font-medium"
    >
      {COPY[pickLang()]}
    </div>
  );
}
