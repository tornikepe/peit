'use client';

// Negative-feedback inbox (Feature #7).
// Lists bot answers that visitors flagged thumbs-down, grouped by content,
// sorted by frequency so the owner sees the most-broken answers first.
// Each row links to a recent conversation that triggered the flag so the
// owner can review context before correcting the bot.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsDown, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Negative {
  content:        string;
  count:          number;
  botId:          string;
  botName:        string;
  lastAt:         string;
  conversationId: string;
}

export default function FeedbackPage() {
  const en = useLanguage().lang === 'en';
  const [items, setItems]     = useState<Negative[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/feedback/negatives');
        const data = await res.json();
        if (!alive) return;
        if (!res.ok || !data.ok) {
          setErr(data.error || 'LOAD_FAILED');
        } else {
          setItems(data.negatives);
        }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'network');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ThumbsDown className="w-5 h-5 text-rose-400" />
          {en ? 'Negative feedback' : 'ნეგატიური გამოხმაურება'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {en ? 'Answers visitors rated 👎, sorted by frequency — your priority list of answers to fix.' : 'პასუხები, რომლებსაც ვიზიტორებმა 👎 დაუჭირეს. სიხშირის მიხედვით — გასასწორებელი პასუხების პრიორიტეტი.'}
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> {en ? 'Loading...' : 'იტვირთება...'}
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {en ? 'Failed to load' : 'ვერ ჩავტვირთე'} ({err}).
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
          <ThumbsDown className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{en ? 'No negative feedback yet. 🎉' : 'ჯერ ნეგატიური გამოხმაურება არ გაქვს. 🎉'}</p>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <Link
              href={`/dashboard/conversations?c=${it.conversationId}`}
              className="flex items-start gap-3 p-4"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <span className="text-rose-300 text-sm font-semibold">×{it.count}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 line-clamp-2 leading-relaxed">
                  {it.content}
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  {it.botName}
                  <span className="opacity-50">·</span>
                  {new Date(it.lastAt).toLocaleDateString(en ? 'en-US' : 'ka-GE', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 mt-1 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
