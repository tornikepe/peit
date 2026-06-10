'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Plus, Trash2, AlertCircle, Check } from 'lucide-react';

interface Props {
  /** Current saved list (from bot record). */
  value: string[];
  /** Persist a new list — should call updateBot. */
  onSave: (next: string[]) => Promise<void>;
}

function isValidOriginEntry(s: string): boolean {
  const v = s.trim().toLowerCase();
  if (!v) return false;
  // Allow: hostname, full origin, *.subdomain
  if (v.startsWith('*.')) {
    return /^\*\.[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v);
  }
  // Try parsing as URL
  try {
    new URL(v.startsWith('http') ? v : `https://${v}`);
    return true;
  } catch {
    return false;
  }
}

export default function AllowedOrigins({ value, onSave }: Props) {
  const en = useLanguage().lang === 'en';
  const [list, setList] = useState<string[]>(value);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Re-sync if the parent's saved value changes (e.g. after another tab
  // edits the same bot). Joining on '|' gives a stable string dep so the
  // effect only fires on actual content changes, not array-identity flips.
  const valueKey = value.join('|');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(value);
  }, [valueKey]);

  async function commit(next: string[]) {
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setList(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : (en ? 'Save failed' : 'შენახვა ვერ მოხერხდა'));
    } finally {
      setSaving(false);
    }
  }

  async function add() {
    const v = input.trim();
    if (!v) return;
    if (!isValidOriginEntry(v)) {
      setError(en ? 'Invalid format — use example.com or *.example.com' : 'არასწორი ფორმატი — გამოიყენე example.com ან *.example.com');
      return;
    }
    if (list.includes(v)) {
      setError(en ? 'This domain is already added' : 'ეს დომენი უკვე დამატებულია');
      return;
    }
    setInput('');
    await commit([...list, v]);
  }

  async function remove(entry: string) {
    await commit(list.filter(e => e !== entry));
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <h2 className="text-white font-semibold">{en ? 'Allowed domains' : 'დაშვებული დომენები'}</h2>
        </div>
        {savedFlash && (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <Check className="w-3 h-3" /> {en ? 'Saved' : 'შენახულია'}
          </span>
        )}
      </div>

      <p className="text-gray-500 text-xs mb-4 leading-relaxed">
        {en ? 'If empty — the bot can be embedded on any site. Add domains so it only works from your sites.' : 'თუ ცარიელია — ბოტი ნებისმიერ საიტზე ჩაიდევა. დაამატე დომენები რომ მხოლოდ შენი საიტებიდან მუშაობდეს.'}
      </p>

      {/* Add form */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          placeholder={en ? 'example.com or *.example.com' : 'example.com ან *.example.com'}
          disabled={saving}
          className="flex-1 bg-[#13131f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 disabled:opacity-50"
        />
        <button
          onClick={add}
          disabled={!input.trim() || saving}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          {en ? 'Add' : 'დამატება'}
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <p className="text-gray-600 text-xs italic">{en ? 'Empty — any domain is allowed.' : 'ცარიელია — ნებისმიერი დომენი დაშვებულია.'}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map(entry => (
            <div
              key={entry}
              className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2"
            >
              <span className="text-white text-sm font-mono truncate">{entry}</span>
              <button
                onClick={() => remove(entry)}
                disabled={saving}
                className="text-gray-500 hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                aria-label={`Remove ${entry}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
