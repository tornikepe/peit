'use client';

// Drop-in CTA button used by the Pricing page. Handles three cases:
//   1. Not signed in → goes to /signup?plan=<slug>
//   2. Signed in, billing not yet configured → error message
//   3. Signed in + LS ready → POST /api/lemon/checkout, redirect
//
// Renders a spinner while the checkout session is being created.

import { useState } from 'react';
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

  async function handleClick() {
    setError(null);

    if (!isLoaded) return; // wait for Clerk to settle

    if (!isSignedIn) {
      // Send to signup with the chosen plan as a return hint
      router.push(`/signup?plan=${plan}&redirect_url=/pricing?go=${plan}`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/lemon/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(humanizeError(data.error, data.message));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setBusy(false);
    }
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
    case 'LEMON_NOT_CONFIGURED':    return 'გადახდის სისტემა ჯერ არ არის დაყენებული. შეგიძლია დაუკავშირდე ჩვენს გუნდს.';
    case 'VARIANT_NOT_CONFIGURED':  return 'ეს პლანი ჯერ არაა აქტიური. სცადე მოგვიანებით.';
    case 'LEMON_API_ERROR':         return 'გადახდის სერვისი დროებით მიუწვდომელია. სცადე მოგვიანებით.';
    case 'UNAUTHORIZED':            return 'შესვლა გჭირდება გასაგრძელებლად.';
    case 'INVALID_PLAN':            return 'არასწორი პლანი.';
    default:                        return msg || 'შეცდომა გადახდის გაშვებისას.';
  }
}
