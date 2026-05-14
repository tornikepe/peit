'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Download, Search, Filter, Loader2, AlertCircle,
  Mail, Phone, MessageSquare, CheckCircle2, ChevronDown, Inbox,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

interface Lead {
  id:        string;
  botId:     string;
  botName:   string;
  name:      string | null;
  email:     string | null;
  phone:     string | null;
  message:   string | null;
  status:    LeadStatus;
  createdAt: string;
}

interface ListResponse {
  ok:     true;
  leads:  Lead[];
  total:  number;
  counts: Record<LeadStatus | 'total', number>;
}

const STATUS_META: Record<LeadStatus, { label: string; color: string; ring: string }> = {
  new:       { label: 'ახალი',         color: 'text-violet-300 bg-violet-500/15', ring: 'ring-violet-500/30' },
  contacted: { label: 'დაკავშირებული',  color: 'text-blue-300 bg-blue-500/15',     ring: 'ring-blue-500/30' },
  qualified: { label: 'კვალიფიცირებული', color: 'text-amber-300 bg-amber-500/15',   ring: 'ring-amber-500/30' },
  won:       { label: 'მოგებული',       color: 'text-emerald-300 bg-emerald-500/15', ring: 'ring-emerald-500/30' },
  lost:      { label: 'დაკარგული',       color: 'text-gray-400 bg-white/[0.04]',    ring: 'ring-white/[0.08]' },
};

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    }>
      <LeadsInner />
    </Suspense>
  );
}

function LeadsInner() {
  const [data, setData]       = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [busyId, setBusyId]             = useState<string | null>(null);

  // Debounce search input — search after 250ms of typing pause.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (statusFilter !== 'all') p.set('status', statusFilter);
    if (debouncedSearch)        p.set('search', debouncedSearch);
    p.set('limit', '100');
    return p.toString();
  }, [statusFilter, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads?${queryString}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'ვერ ჩაიტვირთა');
        return;
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'უცნობი შეცდომა');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(leadId: string, status: LeadStatus) {
    setBusyId(leadId);
    // Optimistic update — flip the row immediately, roll back on error.
    setData(prev => prev ? {
      ...prev,
      leads: prev.leads.map(l => l.id === leadId ? { ...l, status } : l),
    } : prev);

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) {
        await load(); // roll back by re-fetching server truth
      } else {
        // Refresh counts (the optimistic update didn't touch them)
        load();
      }
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    const p = new URLSearchParams();
    if (statusFilter !== 'all') p.set('status', statusFilter);
    if (debouncedSearch)        p.set('search', debouncedSearch);
    window.location.href = `/api/leads/export?${p.toString()}`;
  }

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-white font-semibold text-sm">ლიდები</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-extrabold text-white text-xl tracking-[-0.04em] leading-none"
            >
              pe<span className="gradient-text">i</span>t
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Heading row */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
              ლიდები
              {data && (
                <span className="ml-3 text-base font-medium text-gray-500">
                  · {data.total} {statusFilter === 'all' ? 'სულ' : 'ფილტრის შესაბამისად'}
                </span>
              )}
            </h2>
            <p className="text-gray-500 text-sm">ყველა ლიდი ბოტებიდან · ფილტრე, შეცვალე სტატუსი ან გადმოწერე CSV.</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={!data || data.leads.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white text-sm font-medium px-4 py-2.5 hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CSV გადმოწერა
          </button>
        </div>

        {/* Filter pills + search */}
        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Filter className="w-4 h-4 text-gray-500 shrink-0" />
            <FilterPill
              label="ყველა"
              count={data?.counts.total ?? 0}
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              colorClass="text-white bg-white/[0.06]"
            />
            {STATUS_ORDER.map(s => (
              <FilterPill
                key={s}
                label={STATUS_META[s].label}
                count={data?.counts[s] ?? 0}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                colorClass={STATUS_META[s].color}
              />
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="სახელი, email, ნომერი..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/40 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Body */}
        {loading && !data && (
          <div className="glass rounded-2xl py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold text-sm">ვერ ჩაიტვირთა</p>
              <p className="text-gray-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!loading && data && data.leads.length === 0 && (
          <div className="glass rounded-2xl py-20 flex flex-col items-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-white font-semibold mb-1.5">ჯერ არცერთი ლიდი</h3>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              {statusFilter !== 'all' || debouncedSearch
                ? 'ფილტრის შესაბამისი ლიდი ვერ მოიძებნა.'
                : 'როცა ვიზიტორი დატოვებს კონტაქტს — სახელს, email-ს ან ნომერს — გამოჩნდება აქ. ბოტი widget-ში ავტომატურად აგროვებს.'}
            </p>
          </div>
        )}

        {data && data.leads.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">თარიღი</th>
                    <th className="px-5 py-3 font-medium">კონტაქტი</th>
                    <th className="px-5 py-3 font-medium">ბოტი</th>
                    <th className="px-5 py-3 font-medium">შეტყობინება</th>
                    <th className="px-5 py-3 font-medium">სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      busy={busyId === lead.id}
                      onStatus={s => updateStatus(lead.id, s)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {data.leads.map(lead => (
                <LeadCardMobile
                  key={lead.id}
                  lead={lead}
                  busy={busyId === lead.id}
                  onStatus={s => updateStatus(lead.id, s)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────

function FilterPill({
  label, count, active, onClick, colorClass,
}: {
  label: string; count: number; active: boolean; onClick: () => void; colorClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
        active
          ? `${colorClass} ring-1 ring-white/10`
          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {label}
      <span className={`text-[10px] font-mono ${active ? 'opacity-80' : 'opacity-60'}`}>
        {count}
      </span>
    </button>
  );
}

function StatusSelect({
  value, busy, onChange,
}: { value: LeadStatus; busy: boolean; onChange: (s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[value];
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.color} ${meta.ring} cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50`}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
        {meta.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border border-white/[0.08] bg-[#0d0d1a] shadow-2xl py-1.5">
            {STATUS_ORDER.map(s => {
              const m = STATUS_META[s];
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-white/[0.04] transition-colors ${
                    s === value ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${m.color.split(' ')[1]}`} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function LeadRow({
  lead, busy, onStatus,
}: { lead: Lead; busy: boolean; onStatus: (s: LeadStatus) => void }) {
  return (
    <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
        {formatDate(lead.createdAt)}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          {lead.name && <span className="text-white font-medium">{lead.name}</span>}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="text-violet-400 text-xs hover:text-violet-300 inline-flex items-center gap-1 w-fit">
              <Mail className="w-3 h-3" /> {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="text-cyan-400 text-xs hover:text-cyan-300 inline-flex items-center gap-1 w-fit">
              <Phone className="w-3 h-3" /> {lead.phone}
            </a>
          )}
        </div>
      </td>
      <td className="px-5 py-4 text-gray-300 text-xs">
        <Link href={`/dashboard/bots/${lead.botId}`} className="hover:text-violet-300 transition-colors">
          {lead.botName}
        </Link>
      </td>
      <td className="px-5 py-4 max-w-[300px]">
        {lead.message ? (
          <p className="text-gray-300 text-xs leading-relaxed line-clamp-2" title={lead.message}>
            {lead.message}
          </p>
        ) : (
          <span className="text-gray-700 text-xs italic">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <StatusSelect value={lead.status} busy={busy} onChange={onStatus} />
      </td>
    </tr>
  );
}

function LeadCardMobile({
  lead, busy, onStatus,
}: { lead: Lead; busy: boolean; onStatus: (s: LeadStatus) => void }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {lead.name && <p className="text-white font-medium truncate">{lead.name}</p>}
          <p className="text-gray-500 text-[11px]">{formatDate(lead.createdAt)} · {lead.botName}</p>
        </div>
        <StatusSelect value={lead.status} busy={busy} onChange={onStatus} />
      </div>
      <div className="flex flex-col gap-1 text-xs">
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="text-violet-400 inline-flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> {lead.email}
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="text-cyan-400 inline-flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> {lead.phone}
          </a>
        )}
        {lead.message && (
          <div className="flex items-start gap-1.5 text-gray-400">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{lead.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth() &&
    d.getDate()     === today.getDate();

  if (isToday) {
    return `დღეს ${d.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('ka-GE', { day: '2-digit', month: 'short', year: 'numeric' });
}
