'use client';

// "Hand off to human" button. Two-state:
//   - Not handed off → primary action, requires a confirm dialog so the
//     owner can't accidentally pause the bot.
//   - Handed off    → disabled button + a green badge showing when it
//     happened. Clicking the small "↺ resume bot" link below it flips
//     the flag back to false (no confirm needed — resuming auto-reply
//     is a recoverable action).

import { useState } from 'react';
import { UserCheck, RotateCcw, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  isHandedOff: boolean;
  handedOffAt: string | null;
  /** Parent-supplied PATCH. Resolves with the canonical state. */
  onChange:    (next: { isHandedOff: boolean }) => Promise<void>;
  disabled?:   boolean;
}

export default function HandoffButton({ isHandedOff, handedOffAt, onChange, disabled }: Props) {
  const en = useLanguage().lang === 'en';
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  async function flip(to: boolean) {
    setBusy(true);
    setErr(null);
    try { await onChange({ isHandedOff: to }); setAsking(false); }
    catch (e) { setErr(e instanceof Error ? e.message : 'failed'); }
    finally   { setBusy(false); }
  }

  if (isHandedOff) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled
          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-medium border border-emerald-500/20 inline-flex items-center gap-1.5 cursor-not-allowed"
        >
          <UserCheck className="w-3.5 h-3.5" />
          {en ? 'Handed off to operator' : 'გადაცემულია ოპერატორზე'}
          {handedOffAt && (
            <span className="text-[10px] text-emerald-400/80">
              · {new Date(handedOffAt).toLocaleString(en ? 'en-US' : 'ka-GE', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => flip(false)}
          disabled={disabled || busy}
          className="self-start text-[11px] text-gray-500 hover:text-violet-300 inline-flex items-center gap-1 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          {en ? 'Resume bot' : 'ბოტი დააბრუნე'}
        </button>
      </div>
    );
  }

  if (asking) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
        <p className="text-[11px] text-amber-200 leading-relaxed">
          {en ? 'The bot will stop auto-replying in this conversation — the customer will know a real person is answering.' : 'ბოტი შეწყვეტს ავტო-პასუხებს ამ საუბრისთვის — customer-მა იცის რომ ცოცხალი ადამიანი უპასუხებს.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => flip(true)}
            disabled={busy}
            className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            {en ? 'Hand off' : 'გადასაცემო'}
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            disabled={busy}
            className="px-3 py-1 text-xs text-gray-400 hover:text-white"
          >
            {en ? 'Cancel' : 'გაუქმება'}
          </button>
        </div>
        {err && <p className="text-[11px] text-red-400">{err}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAsking(true)}
      disabled={disabled || busy}
      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-medium border border-amber-500/20 inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <UserCheck className="w-3.5 h-3.5" />
      {en ? 'Hand off to operator' : 'ოპერატორზე გადაცემა'}
    </button>
  );
}
