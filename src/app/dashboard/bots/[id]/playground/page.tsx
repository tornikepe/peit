'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowLeft, Bot as BotIcon, Send, RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useBots } from '@/context/BotsContext';
import { DEFAULT_GREETINGS, type BotLang } from '@/lib/bots';

interface Msg {
  id: number;
  from: 'user' | 'bot';
  text: string;
  matched?: boolean;
  source?: 'faq' | 'knowledge' | 'fallback';
}

const LANG_LABELS: Record<BotLang, { flag: string; name: string; placeholder: string; reset: string }> = {
  ka: { flag: '🇬🇪', name: 'ქართული', placeholder: 'დაწერე შეტყობინება...', reset: 'გასუფთავება' },
  en: { flag: '🇬🇧', name: 'English',  placeholder: 'Type a message...',     reset: 'Reset' },
  ru: { flag: '🇷🇺', name: 'Русский',  placeholder: 'Написать сообщение...', reset: 'Сбросить' },
};

export default function PlaygroundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getBot, loaded, updateBot } = useBots();
  const bot = getBot(id);

  const [activeLang, setActiveLang] = useState<BotLang>('ka');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [counter, setCounter] = useState(1);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize lang to bot's primary, and seed greeting
  useEffect(() => {
    if (bot) {
      setActiveLang(bot.primaryLang);
      const greet = bot.greeting[bot.primaryLang] ?? DEFAULT_GREETINGS[bot.primaryLang];
      setMsgs([{ id: 0, from: 'bot', text: greet }]);
    }
  }, [bot?.id]);

  // Re-seed when language changes
  useEffect(() => {
    if (bot) {
      const greet = bot.greeting[activeLang] ?? DEFAULT_GREETINGS[activeLang];
      setMsgs([{ id: counter, from: 'bot', text: greet }]);
      setCounter(c => c + 1);
      setConversationId(null); // start a fresh conversation per language
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  if (!loaded) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <p className="text-white text-lg mb-2">ბოტი ვერ მოიძებნა</p>
        <Link href="/dashboard" className="btn-primary text-white font-semibold px-6 py-3 rounded-xl text-sm mt-4">
          Dashboard
        </Link>
      </div>
    );
  }

  async function send() {
    if (!input.trim() || !bot || typing) return;
    const msg = input.trim();
    const uid = counter;
    setCounter(c => c + 2);
    setInput('');
    setMsgs(prev => [...prev, { id: uid, from: 'user', text: msg }]);
    setTyping(true);

    try {
      // Use the same public widget API the embed uses — keeps the answer
      // engine and DB logging in one place. channel=playground lets us tell
      // these conversations apart in analytics.
      const res = await fetch(`/api/widget/${bot.id}/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: msg,
          lang: activeLang,
          conversationId,
          channel: 'playground',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'SEND_FAILED');

      if (data.conversationId) setConversationId(data.conversationId);

      const replyText: string = data.reply;
      const source: 'faq' | 'knowledge' | 'fallback' = data.source ?? 'fallback';
      setMsgs(prev => [
        ...prev,
        { id: uid + 1, from: 'bot', text: replyText, matched: source !== 'fallback', source },
      ]);

      // Refresh bot stats from API (it bumped them server-side)
      void updateBot(bot.id, {
        stats: {
          ...bot.stats,
          messages: bot.stats.messages + 1,
          conversations: bot.stats.conversations + (msgs.length <= 1 ? 1 : 0),
        },
      });
    } catch (e) {
      setMsgs(prev => [
        ...prev,
        {
          id: uid + 1,
          from: 'bot',
          text: e instanceof Error ? `⚠ ${e.message}` : '⚠ შეცდომა',
          source: 'fallback',
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function reset() {
    if (!bot) return;
    const greet = bot.greeting[activeLang] ?? DEFAULT_GREETINGS[activeLang];
    setMsgs([{ id: counter, from: 'bot', text: greet }]);
    setCounter(c => c + 1);
    setConversationId(null);
  }

  const ui = LANG_LABELS[activeLang];
  const suggestionsByLang = bot.faqs.slice(0, 4).map(f => f.q).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/20 rounded-full px-3 py-1 mb-3">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-violet-300 text-xs font-medium">Playground</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{bot.name}-ის ტესტი</h1>
            <p className="text-gray-400 text-sm mt-1">
              ცოცხალი ჩატი — სცადე FAQ-ებზე დაფუძნებული პასუხები
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher (only if multi-lang) */}
            {bot.languages.length > 1 && (
              <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
                {bot.languages.map(l => (
                  <button
                    key={l}
                    onClick={() => setActiveLang(l)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeLang === l
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {LANG_LABELS[l].flag} {l.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {ui.reset}
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Bot header */}
          <div
            className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]"
            style={{ background: `linear-gradient(90deg, ${bot.brandColor}30, transparent)` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${bot.brandColor}, ${bot.brandColor}aa)` }}
            >
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{bot.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-gray-400 text-xs">ონლაინ · {ui.name}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 min-h-0">
            {msgs.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'bot' && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `linear-gradient(135deg, ${bot.brandColor}, ${bot.brandColor}aa)` }}
                  >
                    <BotIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.from === 'user'
                        ? 'text-white rounded-br-sm'
                        : 'bg-white/[0.07] text-gray-200 rounded-bl-sm'
                    }`}
                    style={m.from === 'user' ? { background: bot.brandColor } : {}}
                  >
                    {m.text}
                  </div>
                  {m.from === 'bot' && m.source !== undefined && (
                    <p className={`text-[10px] mt-1 px-1 ${
                      m.source === 'faq' ? 'text-emerald-500' :
                      m.source === 'knowledge' ? 'text-blue-400' :
                      'text-amber-500'
                    }`}>
                      {m.source === 'faq' ? '✓ FAQ-ში მოიძებნა' :
                       m.source === 'knowledge' ? '🔍 საიტის კონტენტიდან' :
                       '⚡ Fallback პასუხი'}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 justify-start">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${bot.brandColor}, ${bot.brandColor}aa)` }}
                >
                  <BotIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && suggestionsByLang.length > 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
              {suggestionsByLang.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/[0.06] p-4 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder={ui.placeholder}
              className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40"
            />
            <button
              onClick={send}
              disabled={!input.trim() || typing}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
              style={{ background: bot.brandColor }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          ეს არის ტესტ-რეჟიმი. რეალური მომხმარებლებისთვის გამოიყენე ჩასმის კოდი.
        </p>
    </div>
  );
}
