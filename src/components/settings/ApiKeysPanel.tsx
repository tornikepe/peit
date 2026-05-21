'use client';

// API keys manager. Stripe-style: clicking "Generate key" shows a modal
// with the raw key + copy button + a one-time warning. Existing keys
// show prefix + last-used + revoke action.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Copy, Check, X, Key, AlertCircle } from 'lucide-react';

interface ApiKey {
  id:         string;
  name:       string;
  prefix:     string;
  createdAt:  string;
  lastUsedAt: string | null;
  revokedAt:  string | null;
}

export default function ApiKeysPanel() {
  const [keys,    setKeys]    = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [created, setCreated] = useState<{ name: string; rawKey: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      const json = await res.json();
      if (res.ok) setKeys(json.keys ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function revoke(id: string) {
    if (!confirm('ნამდვილად გაუქმდეს ეს გასაღები? ეს არ შეიძლება გაუქმდეს.')) return;
    await fetch(`/api/settings/api-keys/${id}`, { method: 'DELETE' });
    void load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-300" /> API გასაღებები
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              გასაღების მნიშვნელობა ჩანს მხოლოდ ერთხელ შექმნისას — შემდეგ მხოლოდ prefix
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> ახალი გასაღები
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="text-left font-medium pb-2">სახელი</th>
                  <th className="text-left font-medium pb-2">Prefix</th>
                  <th className="text-left font-medium pb-2">შექმნა</th>
                  <th className="text-left font-medium pb-2">ბოლო გამოყენება</th>
                  <th className="text-right font-medium pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-xs text-gray-500 py-8">
                      ჯერ API გასაღები არ შეგიქმნია
                    </td>
                  </tr>
                ) : keys.map(k => (
                  <tr key={k.id} className="border-t border-white/[0.04]">
                    <td className="py-2.5 text-white">{k.name}</td>
                    <td className="py-2.5">
                      <code className="text-[11px] bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-violet-200">
                        {k.prefix}…
                      </code>
                    </td>
                    <td className="py-2.5 text-gray-400">{formatDate(k.createdAt)}</td>
                    <td className="py-2.5 text-gray-400">
                      {k.lastUsedAt ? formatDate(k.lastUsedAt) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      {k.revokedAt ? (
                        <span className="text-[10px] text-gray-500">გაუქმებული</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => revoke(k.id)}
                          className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3" /> გაუქმება
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewKeyModal
          onClose={() => setShowNew(false)}
          onCreated={k => { setShowNew(false); setCreated(k); void load(); }}
        />
      )}
      {created && (
        <ShowKeyModal
          name={created.name}
          rawKey={created.rawKey}
          onClose={() => setCreated(null)}
        />
      )}
    </div>
  );
}

function NewKeyModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (k: { name: string; rawKey: string }) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'create failed');
      onCreated({ name: json.key.name, rawKey: json.key.rawKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'create failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">ახალი API გასაღები</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-gray-500">სახელი</span>
          <input
            required
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='მაგ. "Production server"'
            className="mt-1 w-full bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </label>
        {error && (
          <p className="mt-3 text-xs text-red-400 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || name.trim().length === 0}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            გენერაცია
          </button>
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-white">
            გაუქმება
          </button>
        </div>
      </form>
    </div>
  );
}

function ShowKeyModal({ name, rawKey, onClose }: {
  name: string;
  rawKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked — user can copy manually */ }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4">
      <div className="w-full max-w-lg bg-[#0d0d1a] border border-violet-500/30 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-white font-semibold">გასაღები შექმნილია: {name}</h3>
        <p className="text-xs text-amber-300 mt-2 leading-relaxed inline-flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          ეს გასაღები ჩანს მხოლოდ ერთხელ. გადაინახე ახლავე — ვერ ნახავ ხელახლა.
        </p>

        <div className="mt-4 flex items-stretch gap-2">
          <code className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-[12px] font-mono text-violet-200 break-all">
            {rawKey}
          </code>
          <button
            type="button"
            onClick={copy}
            className="px-3 rounded-lg bg-violet-500/90 hover:bg-violet-500 text-white text-xs inline-flex items-center gap-1.5"
          >
            {copied ? <><Check className="w-3.5 h-3.5"/> ✓</> : <><Copy className="w-3.5 h-3.5"/> Copy</>}
          </button>
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg"
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });
}
