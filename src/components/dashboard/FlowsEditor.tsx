'use client';

// Feature #1: simple step-list builder for conversation flows.
// Not a canvas — a vertical list with up/down arrows, per-step type
// selector, and inline editors for variable name (input steps) and
// option list (button steps).

import { useEffect, useState } from 'react';
import {
  Plus, Trash2, ArrowUp, ArrowDown, GitBranch, Loader2, Play, Pause,
  MessageSquare, Send, Check,
} from 'lucide-react';

type StepType = 'message' | 'input' | 'button';

interface Option { label: string; value: string; nextStepId?: string }
interface Step {
  id:         string;
  type:       StepType;
  text:       string;
  variable?:  string;
  options?:   Option[];
  nextStepId?: string;
}
interface Flow {
  id:       string;
  name:     string;
  steps:    Step[];
  isActive: boolean;
}

const newId = () => 'step_' + Math.random().toString(36).slice(2, 9);

export default function FlowsEditor({ botId }: { botId: string }) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft]     = useState<Flow | null>(null);

  useEffect(() => {
    (async () => {
      const res  = await fetch(`/api/bots/${botId}/flows`);
      const data = await res.json();
      if (res.ok && data.ok) setFlows(data.flows);
      setLoading(false);
    })();
  }, [botId]);

  async function createFlow() {
    const res = await fetch(`/api/bots/${botId}/flows`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'ახალი flow' }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setFlows(f => [...f, data.flow]);
      setEditing(data.flow.id);
      setDraft(data.flow);
    }
  }
  async function deleteFlow(id: string) {
    setFlows(f => f.filter(x => x.id !== id));
    await fetch(`/api/bots/${botId}/flows`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  }
  async function setActive(id: string, active: boolean) {
    setFlows(f => f.map(x => x.id === id ? { ...x, isActive: active } : x));
    await fetch(`/api/bots/${botId}/flows`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id, isActive: active }]),
    });
  }
  async function saveDraft() {
    if (!draft) return;
    await fetch(`/api/bots/${botId}/flows`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: draft.id, name: draft.name, steps: draft.steps }]),
    });
    setFlows(f => f.map(x => x.id === draft.id ? draft : x));
    setEditing(null);
    setDraft(null);
  }

  function openEditor(f: Flow) {
    setEditing(f.id);
    // Deep clone steps so cancel reverts properly.
    setDraft({ ...f, steps: f.steps.map(s => ({ ...s, options: s.options?.map(o => ({ ...o })) })) });
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-violet-400" />
        <h2 className="text-white font-semibold">საუბრის სცენარები</h2>
      </div>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">
        Multi-step flow — მაგ. „კითხე სახელი → კითხე ტელეფონი → დაადასტურე → შენახე ლიდი“. აქტიური flow იწყება ვიჯეტის გახსნისთანავე AI-ის ნაცვლად.
      </p>

      {loading
        ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        : flows.length === 0
          ? <p className="text-xs text-gray-600 italic mb-3">ჯერ Flow არ გაქვს. ↓</p>
          : (
            <div className="flex flex-col gap-2 mb-3">
              {flows.map(f => (
                <div key={f.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setActive(f.id, !f.isActive)}
                    className={`p-1.5 rounded-md ${f.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-white/5'}`}
                    title={f.isActive ? 'აქტიური' : 'პაუზაზე'}
                  >
                    {f.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditor(f)}
                    className="flex-1 text-left text-sm text-gray-200 hover:text-white"
                  >
                    {f.name} <span className="text-xs text-gray-500">({f.steps.length} ნაბიჯი)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFlow(f.id)}
                    className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

      <button
        type="button"
        onClick={createFlow}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-violet-300 border border-violet-500/30 hover:bg-violet-500/10"
      >
        <Plus className="w-3 h-3" /> ახალი flow
      </button>

      {editing && draft && (
        <StepListEditor
          draft={draft}
          setDraft={setDraft}
          onCancel={() => { setEditing(null); setDraft(null); }}
          onSave={saveDraft}
        />
      )}
    </div>
  );
}

// ─── Step list editor (modal-ish, expands below the flow list) ────────────

function StepListEditor({
  draft, setDraft, onCancel, onSave,
}: {
  draft: Flow;
  setDraft: (f: Flow) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const updateStep = (idx: number, patch: Partial<Step>) =>
    setDraft({ ...draft, steps: draft.steps.map((s, i) => i === idx ? { ...s, ...patch } : s) });
  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= draft.steps.length) return;
    const next = [...draft.steps];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    setDraft({ ...draft, steps: next });
  };
  const addStep = (type: StepType) => {
    const newStep: Step = { id: newId(), type, text: '' };
    if (type === 'button') newStep.options = [{ label: 'დიახ', value: 'yes' }];
    if (type === 'input')  newStep.variable = 'response';
    setDraft({ ...draft, steps: [...draft.steps, newStep] });
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col gap-3">
      <input
        type="text"
        value={draft.name}
        maxLength={120}
        onChange={e => setDraft({ ...draft, name: e.target.value })}
        className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-semibold outline-none focus:border-violet-500/40"
      />

      {draft.steps.map((s, i) => (
        <div key={s.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <select
              value={s.type}
              onChange={e => updateStep(i, { type: e.target.value as StepType })}
              className="bg-black/40 border border-white/[0.08] rounded-md px-2 py-1 text-xs text-gray-100"
            >
              <option value="message">💬 შეტყობინება</option>
              <option value="input">⌨️ კითხე ტექსტი</option>
              <option value="button">🔘 ღილაკები</option>
            </select>
            <span className="text-[10px] text-gray-600 font-mono flex-1">{s.id}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === draft.steps.length - 1}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30">
              <ArrowDown className="w-3 h-3" />
            </button>
            <button type="button"
              onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
              className="p-1 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <textarea
            value={s.text}
            rows={2}
            maxLength={1000}
            onChange={e => updateStep(i, { text: e.target.value })}
            placeholder="ბოტის ტექსტი"
            className="w-full bg-black/30 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-gray-100 outline-none focus:border-violet-500/40 resize-y"
          />

          {s.type === 'input' && (
            <input
              type="text"
              value={s.variable ?? ''}
              maxLength={32}
              onChange={e => updateStep(i, { variable: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
              placeholder="ცვლადის სახელი (name / email / phone)"
              className="bg-black/30 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-gray-100 outline-none focus:border-violet-500/40"
            />
          )}

          {s.type === 'button' && (
            <div className="flex flex-col gap-1.5">
              {(s.options ?? []).map((o, k) => (
                <div key={k} className="flex items-center gap-1.5">
                  <input
                    type="text" value={o.label} maxLength={40}
                    onChange={e => updateStep(i, {
                      options: (s.options ?? []).map((x, j) => j === k ? { ...x, label: e.target.value } : x),
                    })}
                    placeholder="ლეიბლი"
                    className="flex-1 bg-black/30 border border-white/[0.08] rounded-md px-2 py-1 text-xs text-gray-100"
                  />
                  <select
                    value={o.nextStepId ?? ''}
                    onChange={e => updateStep(i, {
                      options: (s.options ?? []).map((x, j) => j === k ? { ...x, nextStepId: e.target.value || undefined } : x),
                    })}
                    className="bg-black/30 border border-white/[0.08] rounded-md px-1.5 py-1 text-xs text-gray-100"
                  >
                    <option value="">→ შემდეგი</option>
                    {draft.steps.filter((_, j) => j !== i).map(other => (
                      <option key={other.id} value={other.id}>→ {other.text.slice(0, 20) || other.id}</option>
                    ))}
                  </select>
                  <button type="button"
                    onClick={() => updateStep(i, { options: (s.options ?? []).filter((_, j) => j !== k) })}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button type="button"
                onClick={() => updateStep(i, {
                  options: [...(s.options ?? []), { label: '', value: '' }],
                })}
                className="text-xs text-violet-300 hover:text-violet-200"
              >
                + ღილაკი
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => addStep('message')}
          className="text-xs px-2 py-1.5 rounded-md border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> + Message
        </button>
        <button type="button" onClick={() => addStep('input')}
          className="text-xs px-2 py-1.5 rounded-md border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1">
          <Send className="w-3 h-3" /> + Input
        </button>
        <button type="button" onClick={() => addStep('button')}
          className="text-xs px-2 py-1.5 rounded-md border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1">
          <GitBranch className="w-3 h-3" /> + Buttons
        </button>
        <div className="flex-1" />
        <button type="button" onClick={onCancel}
          className="text-xs text-gray-400 hover:text-white px-2 py-1">
          გაუქმება
        </button>
        <button type="button" onClick={onSave}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white">
          <Check className="w-3 h-3" /> შენახვა
        </button>
      </div>
    </div>
  );
}
