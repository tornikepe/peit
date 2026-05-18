'use client';

// Drop-in CTA button used by the Pricing page. Handles three cases:
//   1. Not signed in → goes to /signup?plan=<slug>&redirect_url=/pricing?go=<slug>
//      so Clerk bounces them back here once authenticated, and the auto-resume
//      effect below opens Lemon Squeezy without a second click.
//   2. Signed in, billing not yet configured → error message
//   3. Signed in + LS ready → POST /api/lemon/checkout, redirect
//
// Renders a spinner while the checkout session is being created.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

interface Props {
  /** Internal plan slug — must match variantIdFor() in plan-prices.ts */
  plan: 'basic' | 'pro' | 'ultimate';
  label: string;
  highlight?: boolean;
}

export default function PricingCheckoutButton({ plan, label, highlight }: Props) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard against double-firing the auto-resume effect (Strict Mode in dev
  // mounts effects twice; we MUST only launch checkout once).
  const autoResumedRef = useRef(false);

  /** Open the Lemon Squeezy hosted checkout for this plan. */
  async function startCheckout() {
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
        setError(humanizeError(data.error, data.message));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('გადახდის ბმული ვერ მოვიდა — სცადე ხელახლა.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setBusy(false);
    }
  }

  // Auto-resume: if the URL says ?go=<this plan>, the user just came back
  // from sign-up — open the checkout immediately. We read the query string
  // directly from `window.location` (rather than useSearchParams) so the
  // /pricing page can stay statically generated — useSearchParams would
  // force the whole subtree into dynamic rendering or a Suspense boundary.
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (!isLoaded || !isSignedIn) return;
    if (typeof window === 'undefined') return;
    const go = new URLSearchParams(window.location.search).get('go');
    if (go !== plan) return;
    autoResumedRef.current = true;
    // Kicking off a network request after the auth state settles is a
    // legitimate use of useEffect — the state updates that startCheckout
    // performs (setBusy, setError) happen async, not during render. Lint
    // is correct in general but conservative for this case.
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    void startCheckout();
  }, [isLoaded, isSignedIn, plan]);

  async function handleClick() {
    setError(null);
    if (!isLoaded) return;
    if (!isSignedIn) {
      // Send to signup with the chosen plan as a return hint — Clerk
      // honours `forceRedirectUrl` from the signup page, so the user
      // lands back on /pricing?go=<plan> and the effect above takes over.
      router.push(`/signup?plan=${plan}&redirect_url=${encodeURIComponent(`/pricing?go=${plan}`)}`);
      return;
    }
    await startCheckout();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !isLoaded}
        className={`w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
          highlight
            ? 'btn-primary text-white'
            : 'border border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20'
        }`}
      >
        {busy
          ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> გადამისამართება...</>)
          : label}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center mt-1">{error}</p>
      )}
    </div>
  );
}

function humanizeError(code?: string, msg?: string): string {
  switch (code) {
    case 'DB_NOT_CONFIGURED':
      // The database isn't reachable — paid features simply can't run yet.
      // Avoid leaking the raw env-var name to end users; ops can read the
      // server log if they need the diagnostic.
      return 'სერვისი მომზადების პროცესშია — სცადე რამდენიმე წუთში, ან მოგვწერე info@peit.ge-ზე.';
    case 'LEMON_NOT_CONFIGURED':
      return msg
        ? `გადახდის სისტემა ჯერ არ არის დაყენებული — ${msg}`
        : 'გადახდის სისტემა ჯერ არ არის დაყენებული. შეგიძლია დაუკავშირდე ჩვენს გუნდს.';
    case 'VARIANT_NOT_CONFIGURED':
      return msg
        ? `ეს პლანი ჯერ არაა აქტიური — ${msg}`
        : 'ეს პლანი ჯერ არაა აქტიური. სცადე მოგვიანებით.';
    case 'LEMON_API_ERROR':         return 'გადახდის სერვისი დროებით მიუწვდომელია. სცადე მოგვიანებით.';
    case 'AUTH_ERROR':              return 'შესვლა გჭირდება გასაგრძელებლად.';
    case 'UNAUTHORIZED':            return 'შესვლა გჭირდება გასაგრძელებლად.';
    case 'INVALID_PLAN':            return 'არასწორი პლანი.';
    case 'INTERNAL':                return 'მცირე ხარვეზი — სცადე ხელახლა, ან მოგვწერე info@peit.ge-ზე.';
    default:                        return msg || 'შეცდომა გადახდის გაშვებისას.';
  }
}
