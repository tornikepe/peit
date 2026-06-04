'use client';

// Referral dashboard — unique link + copy, stat cards, referred-users table.
// Data from GET /api/referral.

import { useEffect, useState } from 'react';
import { Gift, Copy, Check, Users, Clock, Award } from 'lucide-react';

interface ReferredRow { email: string; joinedAt: string; status: 'pending' | 'rewarded' | 'expired' }
interface ReferralData {
  code: string;
  link: string;
  rewardRules: { referredDiscountPercent: number; referrerFreeMonths: number };
  stats: { total: number; pending: number; rewarded: number; freeMonthsEarned: number };
  referred: ReferredRow[];
}

const STATUS_LABEL: Record<ReferredRow['status'], string> = {
  pending:  'მოლოდინში',
  rewarded: 'დაჯილდოვდა',
  expired:  'ვადაგასული',
};
const STATUS_STYLE: Record<ReferredRow['status'], string> = {
  pending:  'bg-amber-500/15 text-amber-300 border-amber-500/20',
  rewarded: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  expired:  'bg-white/[0.06] text-gray-400 border-white/10',
};

export default function ReferralView() {
  const [data, setData]   = useState<ReferralData | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  async function copyLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — user can select manually */ }
  }

  if (error) return <p className="text-sm text-gray-500">მონაცემების ჩატვირთვა ვერ მოხერხდა.</p>;
  if (!data) return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;

  const cards = [
    { label: 'მოწვეული',       value: data.stats.total,            icon: Users, color: 'text-blue-300' },
    { label: 'გამოწერილი',     value: data.stats.rewarded,         icon: Award, color: 'text-emerald-300' },
    { label: 'მოლოდინში',      value: data.stats.pending,          icon: Clock, color: 'text-amber-300' },
    { label: 'უფასო თვეები',   value: data.stats.freeMonthsEarned, icon: Gift,  color: 'text-blue-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero / link */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-blue-300" />
          <h2 className="text-base font-semibold text-white">მოიწვიე და მიიღე ჯილდო</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          გააზიარე შენი ბმული. როცა მოწვეული გამოიწერს — შენ იღებ{' '}
          <span className="text-blue-300 font-medium">{data.rewardRules.referrerFreeMonths} უფასო თვეს</span>,
          ისინი კი <span className="text-blue-300 font-medium">{data.rewardRules.referredDiscountPercent}% ფასდაკლებას</span> პირველ თვეზე.
        </p>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 min-w-0 rounded-xl bg-[#13131f] border border-white/10 px-4 py-3 text-sm text-gray-200 font-mono truncate">
            {data.link}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'დაკოპირდა' : 'ბმულის კოპირება'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5">
            <c.icon className={`w-5 h-5 mb-3 ${c.color}`} />
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Referred table */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">მოწვეული მომხმარებლები</h3>
        </div>
        {data.referred.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            ჯერ არავინ მოგიწვევია — გააზიარე ბმული დასაწყებად.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="px-5 py-2 font-medium">მომხმარებელი</th>
                <th className="px-5 py-2 font-medium">თარიღი</th>
                <th className="px-5 py-2 font-medium text-right">სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {data.referred.map((r, i) => (
                <tr key={i} className="border-t border-white/[0.05]">
                  <td className="px-5 py-3 text-gray-200 font-mono">{r.email}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(r.joinedAt).toLocaleDateString('ka-GE')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
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
