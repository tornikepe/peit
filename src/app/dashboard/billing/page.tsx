'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Zap, ArrowLeft, CreditCard, Crown, Loader2,
  CheckCircle2, AlertCircle, ExternalLink, Sparkles,
} from 'lucide-react';

interface SubscriptionData {
  ok: true;
  subscription: {
    plan:               'starter' | 'pro' | 'business' | 'enterprise';
    status:             'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
    usable:             boolean;
    trialEndsAt:        string | null;
    currentPeriodEnd:   string | null;
    messagesThisPeriod: number;
  };
  usage:  { bots: number; messages: number };
  limits: {
    bots: number | null; messagesPerMonth: number | null;
    chunksPerBot: number | null; faqsPerBot: number | null;
    domainAllowlist: boolean; removeBranding: boolean;
  };
}

const PLAN_META = {
  starter:    { label: 'Starter',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  pro:        { label: 'Pro',        color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  business:   { label: 'Business',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  enterprise: { label: 'Enterprise', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    }>
      <BillingInner />
    </Suspense>
  );
}

function BillingInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Show checkout-success banner if redirected from Stripe
  const checkoutOutcome = sp.get('checkout');

  useEffect(() => {
    let alive = true;
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => { if (alive && d.ok) setData(d); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function openPortal() {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const d = await res.json();
      if (!res.ok || !d.url) {
        setPortalError(d.message || d.error || 'Portal-ი ვერ გაიხსნა');
        return;
      }
      window.location.href = d.url;
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-gray-300">Subscription ვერ ჩაიტვირთა</p>
      </div>
    );
  }

  const { subscription: sub, usage, limits } = data;
  const plan = PLAN_META[sub.plan];
  const isTrialing = sub.status === 'trialing';
  const trialDaysLeft = sub.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-sm">Peit</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-400 text-sm mb-8">პლანის მართვა, ინვოისები, გადახდის მეთოდი.</p>

        {/* Checkout outcome banners */}
        {checkoutOutcome === 'success' && (
          <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">გადახდა წარმატებულია</p>
              <p className="text-gray-400 text-xs mt-0.5">თქვენი პლანი აქტიურია. webhook-ი ანახლებს მონაცემებს რამდენიმე წამში.</p>
            </div>
          </div>
        )}
        {checkoutOutcome === 'canceled' && (
          <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">გადახდა გაუქმდა — შეგიძლია სცადო ისევ.</p>
          </div>
        )}

        {/* Current plan card */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${plan.bg}`}>
                <Crown className={`w-6 h-6 ${plan.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold text-2xl">{plan.label}</p>
                  {isTrialing && (
                    <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {trialDaysLeft} დღე trial
                    </span>
                  )}
                  {sub.status === 'past_due' && (
                    <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      გადახდა ვერ მოხდა
                    </span>
                  )}
                  {sub.status === 'canceled' && (
                    <span className="text-xs text-gray-400 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full">
                      გაუქმებული
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  {sub.currentPeriodEnd && (
                    <>განახლდება / მთავრდება: {new Date(sub.currentPeriodEnd).toLocaleDateString('ka-GE')}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={openPortal}
                disabled={portalBusy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
              >
                {portalBusy
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CreditCard className="w-4 h-4" />}
                პლანის მართვა
                <ExternalLink className="w-3 h-3" />
              </button>
              <Link
                href="/pricing"
                className="text-violet-400 hover:text-violet-300 text-xs text-center transition-colors"
              >
                სხვა პლანი ნახე →
              </Link>
            </div>
          </div>

          {portalError && (
            <p className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" /> {portalError}
            </p>
          )}

          {/* Usage rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/[0.06]">
            <UsageRow label="ბოტები" used={usage.bots} cap={limits.bots} />
            <UsageRow label="შეტყობინებები ამ თვეში" used={usage.messages} cap={limits.messagesPerMonth} />
          </div>
        </div>

        {/* What's included */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">მიმდინარე ლიმიტები</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Feature on={true} text={`${limits.bots ?? '∞'} ბოტი`} />
            <Feature on={true} text={`${limits.messagesPerMonth?.toLocaleString() ?? '∞'} შეტყობინება/თვე`} />
            <Feature on={true} text={`${limits.chunksPerBot ?? '∞'} chunk თითო ბოტზე`} />
            <Feature on={true} text={`${limits.faqsPerBot ?? '∞'} FAQ თითო ბოტზე`} />
            <Feature on={limits.domainAllowlist} text="დომენების allowlist" />
            <Feature on={limits.removeBranding} text='"Powered by Peit" მოშორება' />
          </ul>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-gray-400 text-xs leading-relaxed">
              სცემს უფრო მეტი? <Link href="/pricing" className="text-violet-400 hover:text-violet-300 underline">გადადი ფასიან პლანზე</Link> და მიიღე
              მეტი ბოტი, შეტყობინება, AI Index და დომენის allowlist.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function UsageRow({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-violet-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{used.toLocaleString()} / {cap?.toLocaleString() ?? '∞'}</span>
      </div>
      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Feature({ on, text }: { on: boolean; text: string }) {
  return (
    <li className={`flex items-start gap-2 ${on ? 'text-gray-200' : 'text-gray-600 line-through'}`}>
      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${on ? 'text-violet-400' : 'text-gray-700'}`} />
      <span>{text}</span>
    </li>
  );
}
