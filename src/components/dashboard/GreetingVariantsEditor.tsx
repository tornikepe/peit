'use client';

// Feature #6: A/B greeting variants table.
// Loads variants for a bot, lets the owner add/toggle/delete/edit-weight
// and surfaces impressions, conversions, and CR%. The variant with the
// highest CR (min 50 impressions) gets a "Winner" badge.

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Trophy, Check, Play, Pause } from 'lucide-react';

interface Variant {
  id:          string;
  message:     string;
  weight:      number;
  impressions: number;
  conversions: number;
  isActive:    boolean;
}

const MIN_IMPRESSIONS_FOR_WINNER = 50;

export default function GreetingVariantsEditor({ botId }: { botId: string }) {
  const [variants, setVariants]   = useState<Variant[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(false);
  const [newMsg, setNewMsg]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/bots/${botId}/variants`);
        const data = await res.json();
        if (res.ok && data.ok) setVariants(data.variants);
      } finally { setLoading(false); }
    })();
  }, [botId]);

  // Winner = highest CR among variants with enough impressions to be
  // statistically interesting. Returns null when nobody qualifies.
  const winnerId = (() => {
    const eligible = variants.filter(v => v.impressions >= MIN_IMPRESSIONS_FOR_WINNER);
    if (eligible.length < 2) return null;
    const best = eligible.reduce((a, b) =>
      cr(b) > cr(a) ? b : a, eligible[0]);
    return cr(best) > 0 ? best.id : null;
  })();

  async function addVariant() {
    const message = newMsg.trim();
    if (!message) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bots/${botId}/variants`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ message, weight: 50 }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setVariants(v => [...v, data.variant]);
        setNewMsg('');
      }
    } finally { setBusy(false); }
  }

  async function patchVariant(id: string, change: Partial<Variant>) {
    setVariants(v => v.map(x => x.id === id ? { ...x, ...change } : x));
    await fetch(`/api/bots/${botId}/variants`, {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify([{ id, ...change }]),
    });
  }

  async function removeVariant(id: string) {
    setVariants(v => v.filter(x => x.id !== id));
    await fetch(`/api/bots/${botId}/variants`, {
      method:  'DELETE',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ ids: [id] }),
    });
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h2 className="text-white font-semibold">მისალმების A/B ტესტი</h2>
      </div>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">
        ვიჯეტი თითო ვიზიტორზე შერეცხილად ირჩევს ერთ ვერსიას. კონვერსია = ვიზიტორმა მინიმუმ ერთი შეტყობინება გააგზავნა.
      </p>

      {loading
        ? <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" /> იტვირთება...
          </div>
        : variants.length === 0
          ? <p className="text-xs text-gray-600 italic mb-3">ჯერ ვერსიები არ გაქვს. დაამატე ქვემოთ ↓</p>
          : (
            <div className="flex flex-col gap-2 mb-4">
              {variants.map(v => (
                <div key={v.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => patchVariant(v.id, { isActive: !v.isActive })}
                    className={`mt-1 p-1.5 rounded-md ${v.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-white/5'} hover:bg-white/10`}
                    title={v.isActive ? 'აქტიური' : 'პაუზაზე'}
                  >
                    {v.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <textarea
                      value={v.message}
                      rows={2}
                      maxLength={500}
                      onChange={e => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, message: e.target.value } : x))}
                      onBlur={e => patchVariant(v.id, { message: e.target.value })}
                      className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-100 outline-none focus:border-violet-500/40 resize-y"
                    />
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <label className="flex items-center gap-1.5">
                        წონა
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={v.weight}
                          onChange={e => setVariants(prev => prev.map(x => x.id === v.id ? { ...x, weight: Number(e.target.value) } : x))}
                          onBlur={e => patchVariant(v.id, { weight: Number(e.target.value) })}
                          className="w-14 bg-black/40 border border-white/[0.08] rounded px-1.5 py-0.5 text-gray-100"
                        />
                      </label>
                      <span>· {v.impressions} ჩვენება</span>
                      <span>· {v.conversions} კონვერსია</span>
                      <span>· CR <strong className="text-gray-300">{(cr(v) * 100).toFixed(1)}%</strong></span>
                      {winnerId === v.id && (
                        <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                          <Trophy className="w-2.5 h-2.5" /> Winner
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="mt-1 p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="წაშლა"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

      <div className="flex items-start gap-2">
        <textarea
          value={newMsg}
          maxLength={500}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="ახალი მისალმების ვერსია..."
          rows={2}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-100 placeholder:text-gray-600 outline-none focus:border-violet-500/40 resize-y"
        />
        <button
          type="button"
          onClick={addVariant}
          disabled={!newMsg.trim() || busy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 self-start"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          დამატება
        </button>
      </div>
    </div>
  );
}

function cr(v: Variant): number {
  return v.impressions > 0 ? v.conversions / v.impressions : 0;
}
