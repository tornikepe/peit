'use client';

// Chip-style tag input. Accepts comma-separated tokens or Enter; chips
// are removed via the × button. Saving is debounced to onBlur / Enter —
// every keystroke would otherwise PATCH the server on a single-letter
// tag mid-typing.

import { useEffect, useRef, useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';

interface Props {
  value:   string[];
  onSave:  (next: string[]) => Promise<void>;
  /** Disable editing while a parent action is in flight. */
  disabled?: boolean;
}

export default function TagInput({ value, onSave, disabled }: Props) {
  const [tags,  setTags]  = useState<string[]>(value);
  const [draft, setDraft] = useState('');
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState<string | null>(null);
  const dirtyRef = useRef(false);

  // Sync incoming server state when it changes — but only if we don't
  // have unsaved edits in flight, so the user isn't surprised by a
  // round-trip wiping their draft.
  useEffect(() => {
    if (!dirtyRef.current) setTags(value);
  }, [value]);

  async function persist(next: string[]) {
    setBusy(true);
    setErr(null);
    try {
      await onSave(next);
      dirtyRef.current = false;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'save failed');
    } finally {
      setBusy(false);
    }
  }

  function commitDraft() {
    const parts = draft
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length <= 32);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...tags, ...parts])).slice(0, 16);
    dirtyRef.current = true;
    setTags(next);
    setDraft('');
    void persist(next);
  }

  function remove(t: string) {
    const next = tags.filter(x => x !== t);
    dirtyRef.current = true;
    setTags(next);
    void persist(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] focus-within:border-violet-500/40">
        {tags.map(t => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 text-[11px]"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              disabled={disabled || busy}
              className="text-violet-300 hover:text-white disabled:opacity-50"
              aria-label={`remove ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
              remove(tags[tags.length - 1]);
            }
          }}
          onBlur={() => { if (draft.trim()) commitDraft(); }}
          placeholder={tags.length === 0 ? 'დაამატე tag (Enter ან ,)' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
          disabled={disabled || busy}
        />
        {busy && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
        {!busy && draft.trim() && (
          <button
            type="button"
            onClick={commitDraft}
            className="text-gray-400 hover:text-white"
            aria-label="add tag"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-[11px] text-red-400">{err}</p>}
    </div>
  );
}
