'use client';

// Inline "Upgrade now" button used on the dashboard. Bypasses the /pricing
// page entirely — one click → Lemon Squeezy checkout for the requested
// plan. Lives inside UsagePanel so the user sees it next to their current
// limits, which is the moment they realise they need more headroom.
//
// Also doubles as a global resume hook: if the user signed up while picking
// a plan and the post-Clerk redirect dropped the query string, we still
// have the plan name in sessionStorage. We pop it and bounce to
// /pricing?go=<plan> so the existing PricingCheckoutButton effect can
// finish the job.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type PlanSlug = 'basic' | 'pro' | 'ultimate';

const RESUME_KEY = 'peit-resume-plan';

interface Props {
  /** Defaults to 'pro' — the highlighted plan on the pricing page. */
  plan?: PlanSlug;
  label?: string;
  compact?: boolean;
}

export default function UpgradeCta({ plan = 'pro', label, compact }: Props) {
  const en = useLanguage().lang === 'en';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Auto-resume guard. We may end up on /dashboard with a stale
  // RESUME_KEY left over from a signup that bypassed pricing — bounce
  // back to /pricing?go=<plan> exactly once per mount.
  const resumeFiredRef = useRef(false);

  useEffect(() => {
    if (resumeFiredRef.current) return;
    if (typeof window === 'undefined') return;
    let stashed: string | null = null;
    try { stashed = sessionStorage.getItem(RESUME_KEY); } catch { /* ignore */ }
    if (!stashed) return;
    if (!['basic', 'pro', 'ultimate'].includes(stashed)) {
      try { sessionStorage.removeItem(RESUME_KEY); } catch { /* ignore */ }
      return;
    }
    resumeFiredRef.current = true;
    // Pricing button will pop the key and start checkout immediately.
    router.replace(`/pricing?go=${stashed}`);
  }, [router]);

  async function handleClick() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/lemon/checkout', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(humanizeError(data.error, data.message, en));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(en ? 'Checkout link did not arrive — try again.' : 'გადახდის ბმული ვერ მოვიდა — სცადე ხელახლა.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : (en ? 'Unknown error' : 'უცნობი შეცდომა'));
    } finally {
      setBusy(false);
    }
  }

  const buttonClass = compact
    ? 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-primary text-white disabled:opacity-60 disabled:cursor-not-allowed'
    : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold btn-primary text-white disabled:opacity-60 disabled:cursor-not-allowed';

  const buttonLabel =
    label ?? (plan === 'pro'      ? (en ? 'Upgrade to Pro' : 'Pro-ზე გადასვლა')
            : plan === 'ultimate' ? (en ? 'Upgrade to Ultimate' : 'Ultimate-ზე გადასვლა')
            :                       (en ? 'Buy Basic' : 'Basic-ის შეძენა'));

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={handleClick} disabled={busy} className={buttonClass}>
        {busy
          ? <Loader2 className={compact ? 'w-3 h-3 animate-spin' : 'w-4 h-4 animate-spin'} />
          : <Sparkles className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        {buttonLabel}
      </button>
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}

function humanizeError(code: string | undefined, msg: string | undefined, en: boolean): string {
  switch (code) {
    case 'DB_NOT_CONFIGURED':       return en ? 'The service is being prepared — try again in a few minutes.' : 'სერვისი მომზადების პროცესშია — სცადე რამდენიმე წუთში.';
    case 'LEMON_NOT_CONFIGURED':    return msg ?? (en ? 'Payments are not configured yet.' : 'გადახდის სისტემა ჯერ არ არის დაყენებული.');
    case 'VARIANT_NOT_CONFIGURED':  return msg ?? (en ? 'This plan is not active yet.' : 'ეს პლანი ჯერ არაა აქტიური.');
    case 'LEMON_API_ERROR':         return en ? 'The payment service is temporarily unavailable.' : 'გადახდის სერვისი დროებით მიუწვდომელია.';
    case 'AUTH_ERROR':
    case 'UNAUTHORIZED':            return en ? 'You need to sign in.' : 'შესვლა გჭირდება.';
    case 'INVALID_PLAN':            return en ? 'Invalid plan.' : 'არასწორი პლანი.';
    default:                        return msg || (en ? 'Error starting checkout.' : 'შეცდომა გადახდის გაშვებისას.');
  }
}
