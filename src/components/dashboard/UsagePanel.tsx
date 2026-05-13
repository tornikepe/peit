'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, MessageSquare, Bot as BotIcon, Clock, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  ok: true;
  subscription: {
    plan:               'basic' | 'pro' | 'ultimate' | 'enterprise';
    status:             'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
    usable:             boolean;
    trialEndsAt:        string | null;
    currentPeriodEnd:   string | null;
    messagesThisPeriod: number;
  };
  usage: { bots: number; messages: number };
  limits: {
    bots:             number | null;
    messagesPerMonth: number | null;
    chunksPerBot:     number | null;
    faqsPerBot:       number | null;
    domainAllowlist:  boolean;
    removeBranding:   boolean;
  };
}

const PLAN_LABELS = {
  basic:      { name: 'Basic',      color: 'text-blue-400' },
  pro:        { name: 'Pro',        color: 'text-violet-400' },
  ultimate:   { name: 'Ultimate',   color: 'text-amber-400' },
  enterprise: { name: 'Enterprise', color: 'text-emerald-400' },
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

function progressColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 75) return 'bg-amber-500';
  return 'bg-violet-500';
}

export default function UsagePanel() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => { if (alive && d.ok) setData(d); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  if (error || !data) return null;

  const { subscription: sub, usage, limits } = data;
  const planMeta = PLAN_LABELS[sub.plan];

  const msgPct = limits.messagesPerMonth
    ? Math.min(100, Math.round((usage.messages / limits.messagesPerMonth) * 100))
    : 0;
  const botPct = limits.bots
    ? Math.min(100, Math.round((usage.bots / limits.bots) * 100))
    : 0;

  const trialDays = daysUntil(sub.trialEndsAt);
  const isTrial = sub.status === 'trialing';

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center ${planMeta.color}`}>
            <Crown className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-white font-semibold">
              {planMeta.name}
              {isTrial && <span className="ml-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Trial</span>}
              {!sub.usable && <span className="ml-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Expired</span>}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {isTrial && trialDays !== null && (
                <>
                  <Clock className="inline w-3 h-3 mr-1" />
                  {trialDays > 0 ? `${trialDays} დღე დარჩა` : 'ტრიალი დასრულდა'}
                </>
              )}
              {!isTrial && sub.currentPeriodEnd && (
                <>
                  <Clock className="inline w-3 h-3 mr-1" />
                  განახლდება {new Date(sub.currentPeriodEnd).toLocaleDateString('ka-GE')}
                </>
              )}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/billing"
          className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
        >
          Billing →
        </Link>
      </div>

      {/* Trial expired banner */}
      {!sub.usable && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-semibold">ტრიალი დასრულდა</p>
            <p className="text-gray-400 text-xs mt-0.5">ბოტი აღარ პასუხობს — გადადი ფასიან პლანზე გასაგრძელებლად.</p>
          </div>
        </div>
      )}

      {/* Bots usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <BotIcon className="w-3.5 h-3.5" /> ბოტები
          </div>
          <span className="text-white text-xs font-mono">
            {usage.bots} / {limits.bots ?? '∞'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor(botPct)}`}
            style={{ width: `${botPct}%` }}
          />
        </div>
      </div>

      {/* Messages usage */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <MessageSquare className="w-3.5 h-3.5" /> შეტყობინებები ამ თვეში
          </div>
          <span className="text-white text-xs font-mono">
            {usage.messages.toLocaleString()} / {limits.messagesPerMonth?.toLocaleString() ?? '∞'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor(msgPct)}`}
            style={{ width: `${msgPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
