'use client';

// Lemon Squeezy billing summary. Three cards:
//   1. Current plan + limits + upgrade button
//   2. Customer portal link (where payment method lives — LS manages it)
//   3. Invoices table (downloadable PDFs from LS)

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Crown, ExternalLink, Loader2, Download } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Billing {
  plan:              string;
  status:            string;
  trialEndsAt:       string | null;
  currentPeriodEnd:  string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    botCount:         number;
    messagesPerMonth: number;
    chunksPerBot:     number;
    faqsPerBot:       number;
    poweredByBadge:   boolean;
  };
  usage: { messages: number; tokensIn: number; tokensOut: number };
  invoices: Array<{
    id:        string;
    createdAt: string;
    amount:    number;
    currency:  string;
    status:    string;
    url:       string | null;
  }>;
}

const PLAN_LABEL: Record<string, string> = {
  basic:      'Basic',
  pro:        'Pro',
  ultimate:   'Ultimate',
  enterprise: 'Enterprise',
};

export default function BillingView() {
  const en = useLanguage().lang === 'en';
  const [data,    setData]    = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/settings/billing');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'load failed');
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'load failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openPortal() {
    setPortalBusy(true);
    try {
      const res = await fetch('/api/lemon/portal', { method: 'POST' });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else setError(json.message ?? json.error ?? 'portal unavailable');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'portal failed');
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-red-400">{error ?? 'unavailable'}</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Plan summary */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-violet-300" />
              <span className="text-[11px] uppercase tracking-wider text-gray-500">{en ? 'Current plan' : 'მიმდინარე გეგმა'}</span>
            </div>
            <h2 className="text-white text-2xl font-bold">{PLAN_LABEL[data.plan] ?? data.plan}</h2>
            <p className="text-xs text-gray-500 mt-1">
              {labelStatus(data.status, en)}
              {data.trialEndsAt && (
                <> · {en ? 'trial ends' : 'ტრიალი მთავრდება'} {formatDate(data.trialEndsAt, en)}</>
              )}
              {data.currentPeriodEnd && (
                <> · {data.cancelAtPeriodEnd ? (en ? 'ends' : 'წყდება') : (en ? 'next payment' : 'შემდეგი გადახდა')} {formatDate(data.currentPeriodEnd, en)}</>
              )}
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
          >
            {en ? 'Change plan' : 'გეგმის შეცვლა'}
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label={en ? 'Bots' : 'ბოტი'} v={String(data.limits.botCount)} />
          <Stat label={en ? 'Messages/month' : 'შეტყობინება/თვე'} v={`${data.usage.messages.toLocaleString(en ? 'en-US' : 'ka-GE')} / ${data.limits.messagesPerMonth.toLocaleString(en ? 'en-US' : 'ka-GE')}`} />
          <Stat label={en ? 'Chunks/bot' : 'chunk/ბოტი'} v={String(data.limits.chunksPerBot)} />
          <Stat label={en ? 'FAQs/bot' : 'FAQ/ბოტი'} v={String(data.limits.faqsPerBot)} />
        </div>
      </div>

      {/* Payment method — Lemon Squeezy portal handles this. */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-violet-300" />
              <span className="text-[11px] uppercase tracking-wider text-gray-500">{en ? 'Payment method' : 'გადახდის მეთოდი'}</span>
            </div>
            <p className="text-sm text-gray-300">
              {en ? 'Manage your card and invoice email in the Lemon Squeezy portal' : 'ბარათის + invoice email-ის მართვა Lemon Squeezy-ის portal-ში'}
            </p>
          </div>
          <button
            type="button"
            onClick={openPortal}
            disabled={portalBusy}
            className="text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.06] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {portalBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            {en ? 'Open portal' : 'Portal-ის გახსნა'}
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">{en ? 'Invoices' : 'ინვოისები'}</h3>
        <p className="text-xs text-gray-500 mb-4">{en ? 'Download PDFs from Lemon Squeezy' : 'PDF ჩამოწერა Lemon Squeezy-დან'}</p>

        {data.invoices.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">{en ? 'No invoices yet' : 'ჯერ ინვოისები არ არის'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-gray-600">
              <tr>
                <th className="text-left font-medium pb-2">{en ? 'Date' : 'თარიღი'}</th>
                <th className="text-left font-medium pb-2">{en ? 'Amount' : 'თანხა'}</th>
                <th className="text-left font-medium pb-2">{en ? 'Status' : 'სტატუსი'}</th>
                <th className="text-right font-medium pb-2">PDF</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map(inv => (
                <tr key={inv.id} className="border-t border-white/[0.04]">
                  <td className="py-2 text-gray-300">{formatDate(inv.createdAt, en)}</td>
                  <td className="py-2 text-white tabular-nums">
                    {formatAmount(inv.amount, inv.currency)}
                  </td>
                  <td className="py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      inv.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {inv.url ? (
                      <a
                        href={inv.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 text-xs"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-600">{label}</div>
      <div className="text-white tabular-nums font-medium">{v}</div>
    </div>
  );
}

function formatDate(iso: string, en: boolean): string {
  return new Date(iso).toLocaleDateString(en ? 'en-US' : 'ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** LS returns amounts in minor units (cents). */
function formatAmount(minor: number, currency: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat('ka-GE', { style: 'currency', currency }).format(major);
}

function labelStatus(s: string, en: boolean): string {
  switch (s) {
    case 'trialing':  return en ? 'Trialing' : 'ტრიალში';
    case 'active':    return en ? 'Active' : 'აქტიური';
    case 'past_due':  return en ? 'Past due' : 'ვადაგადაცილებული';
    case 'canceled':  return en ? 'Canceled' : 'გაუქმებული';
    case 'incomplete':return en ? 'Incomplete' : 'არასრული';
    default:          return s;
  }
}
