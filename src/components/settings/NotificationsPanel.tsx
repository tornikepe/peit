'use client';

// Three primary toggle rows the spec asked for, plus two "legacy" rows
// (product updates, trial reminders) so the customer can manage every
// email category in one place. Each toggle auto-saves on click — no
// global "Save" button.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Bell, Check } from 'lucide-react';

interface Prefs {
  leadAlerts:     boolean;
  handoffAlerts:  boolean;
  weeklyReport:   boolean;
  productUpdates: boolean;
  trialReminders: boolean;
}

const ROWS: Array<{
  key:    keyof Prefs;
  label:  string;
  hint:   string;
  primary?: boolean;
}> = [
  { key: 'leadAlerts',     label: 'ლიდის შემოსვლა',           hint: 'როცა customer-ი დატოვებს კონტაქტს', primary: true },
  { key: 'handoffAlerts',  label: 'ოპერატორზე გადაცემა',     hint: 'როცა საუბარი დაიყვანება ცოცხალ ოპერატორზე', primary: true },
  { key: 'weeklyReport',   label: 'კვირის ანგარიში',         hint: 'ორშაბათ დილით ბოლო კვირის სტატისტიკა', primary: true },
  { key: 'productUpdates', label: 'პროდუქტის სიახლეები',     hint: 'მარკეტინგი — ფუნქციები, რჩევები' },
  { key: 'trialReminders', label: 'ტრიალის შეხსენებები',     hint: 'ტრიალის დასრულებამდე 3 დღით ადრე' },
];

export default function NotificationsPanel() {
  const [prefs,   setPrefs]   = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      const json = await res.json();
      if (res.ok) setPrefs(json.prefs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggle(key: keyof Prefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);             // optimistic
    setSavingKey(key);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [key]: next[key] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error('save failed');
      setPrefs(json.prefs);
    } catch {
      // Rollback on error so the toggle's visual state matches the server.
      setPrefs(prefs);
    } finally {
      setSavingKey(null);
    }
  }

  if (loading || !prefs) {
    return (
      <div className="glass rounded-2xl p-8 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg flex items-center gap-2">
        <Bell className="w-4 h-4 text-violet-300" /> ნოტიფიკაციები
      </h2>
      <p className="text-xs text-gray-500 mt-1">
        ცვლილებები ინახება ავტომატურად
      </p>

      <ul className="mt-5 divide-y divide-white/[0.04]">
        {ROWS.map(row => (
          <li key={row.key} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-white">{row.label}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{row.hint}</div>
            </div>
            <Toggle
              checked={prefs[row.key]}
              onChange={() => toggle(row.key)}
              busy={savingKey === row.key}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ checked, onChange, busy }: { checked: boolean; onChange: () => void; busy?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={busy}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-violet-500/90' : 'bg-white/[0.08]'
      } disabled:opacity-60`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white grid place-items-center text-violet-700 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}>
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : checked ? <Check className="w-3 h-3" /> : null}
      </span>
    </button>
  );
}
