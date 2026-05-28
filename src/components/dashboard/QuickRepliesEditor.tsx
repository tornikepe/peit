'use client';

// Dashboard editor for the per-bot quick-reply pills (Feature #2).
// Keeps a local buffer so the user can edit freely; "Save" pushes to the
// server, "Discard" reverts. Up/down arrows reorder.

import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, MessageSquare, Link as LinkIcon, GitBranch, Loader2, Check } from 'lucide-react';
import type { QuickReply, QuickReplyAction } from '@/lib/bots';

interface Props {
  value: QuickReply[];
  onSave: (next: QuickReply[]) => Promise<void>;
}

const MAX = 12;

function emptyReply(): QuickReply {
  return { label: '', action: 'message', value: '' };
}

export default function QuickRepliesEditor({ value, onSave }: Props) {
  const [draft, setDraft] = useState<QuickReply[]>(value);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Re-sync when upstream changes (e.g. after a successful save we get the
  // fresh list back from the server). React 19 derived-state pattern —
  // mutating during render is the supported replacement for the
  // setState-in-effect anti-pattern the lint rule rejects.
  const [lastValue, setLastValue] = useState<QuickReply[]>(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(value);

  function patch(idx: number, p: Partial<QuickReply>) {
    setDraft(d => d.map((r, i) => i === idx ? { ...r, ...p } : r));
  }
  function add() {
    if (draft.length >= MAX) return;
    setDraft(d => [...d, emptyReply()]);
  }
  function remove(idx: number) {
    setDraft(d => d.filter((_, i) => i !== idx));
  }
  function move(idx: number, delta: -1 | 1) {
    const target = idx + delta;
    if (target < 0 || target >= draft.length) return;
    setDraft(d => {
      const next = [...d];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      // Drop empty rows on save — the server will sanitize anyway, but
      // doing it here keeps the UI consistent.
      const cleaned = draft.filter(r => r.label.trim() && r.value.trim());
      await onSave(cleaned);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-violet-400" />
        <h2 className="text-white font-semibold">სწრაფი ღილაკები</h2>
      </div>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">
        ეს ღილაკები გამოჩნდება ჩატის ველის ზემოთ. ვიზიტორი დააჭერს — სისტემა გაუგზავნის ბოტს ტექსტს, ან გახსნის ლინკს.
      </p>

      <div className="flex flex-col gap-2">
        {draft.length === 0 && (
          <p className="text-xs text-gray-600 italic">ჯერ ღილაკები არ გაქვს. დაამატე პირველი ↓</p>
        )}
        {draft.map((qr, i) => (
          <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={qr.label}
                maxLength={40}
                onChange={e => patch(i, { label: e.target.value })}
                placeholder="ღილაკის ტექსტი (მაგ: ფასები)"
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40"
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="ზევით"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === draft.length - 1}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="ქვევით"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
                aria-label="წაშლა"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={qr.action}
                onChange={e => patch(i, { action: e.target.value as QuickReplyAction, value: '' })}
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-violet-500/40"
              >
                <option value="message">📨 გაგზავნე შეტყობინება</option>
                <option value="url">🔗 გახსენი ბმული</option>
                <option value="flow">🌊 დაიწყე flow</option>
              </select>

              <div className="flex-1 relative">
                {qr.action === 'message' && <MessageSquare className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />}
                {qr.action === 'url'     && <LinkIcon       className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />}
                {qr.action === 'flow'    && <GitBranch      className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />}
                <input
                  type="text"
                  value={qr.value}
                  maxLength={500}
                  onChange={e => patch(i, { value: e.target.value })}
                  placeholder={
                    qr.action === 'message' ? 'ტექსტი ბოტისთვის'
                    : qr.action === 'url'   ? 'https://example.com'
                    : 'flow_id'
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={add}
            disabled={draft.length >= MAX}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-violet-300 border border-violet-500/30 hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" /> ღილაკის დამატება
          </button>
          <span className="text-xs text-gray-600">{draft.length} / {MAX}</span>

          <div className="flex-1" />

          {dirty && (
            <button
              type="button"
              onClick={() => setDraft(value)}
              disabled={saving}
              className="text-xs text-gray-400 hover:text-white px-2 py-1"
            >
              გაუქმება
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-3 h-3 animate-spin" /> შენახვა...</>
              : savedAt
                ? <><Check className="w-3 h-3" /> შენახულია</>
                : 'შენახვა'}
          </button>
        </div>
      </div>
    </div>
  );
}
