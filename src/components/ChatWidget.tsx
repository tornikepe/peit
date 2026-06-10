'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/Logo';

// Russian was removed product-wide — the assistant speaks ka/en only.
type Lang = 'ka' | 'en';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

const responses: Record<string, Record<Lang, string>> = {
  pricing: {
    ka: 'ჩვენ გვაქვს 4 პლანი: Basic (₾45/თვე), Pro (₾65/თვე), Ultimate (₾155/თვე) და Enterprise. ყველა იწყება 7-დღიანი უფასო ტრიალით! 💜',
    en: 'We have 4 plans: Basic (₾45/mo), Pro (₾65/mo), Ultimate (₾155/mo) and Enterprise. All start with a 7-day free trial! 💜',
  },
  setup: {
    ka: 'Setup ძალიან მარტივია! ატვირთე FAQ ფაილი ან შეიყვანე ვებსაიტის URL — ბოტი 10 წუთში მზადაა. კოდის ცოდნა საჭირო არ არის. 🚀',
    en: 'Setup is super easy! Upload a FAQ file or enter your website URL — bot is ready in 10 minutes. No coding required. 🚀',
  },
  channels: {
    ka: 'Peit მუშაობს ყველა არხზე: ვებსაიტი, Telegram, Instagram, Facebook Messenger. ყველა საუბარი ერთ dashboard-ში! 📱',
    en: 'Peit works on all channels: website, Telegram, Instagram, Facebook Messenger. All conversations in one dashboard! 📱',
  },
  trial: {
    ka: 'დიახ! 7 დღე სრულიად უფასოდ — საკრედიტო ბარათი საჭირო არ არის. ტრიალის შემდეგ გადახვალ შენთვის სასურველ პლანზე. ✨',
    en: 'Yes! 7 days completely free — no credit card required. After the trial you choose the plan that suits you. ✨',
  },
  languages: {
    ka: 'ბოტი ბუნებრივ ქართულად და ინგლისურად საუბრობს. ყოველი კლიენტი საკუთარ ენაზე ემსახურება! 🇬🇪',
    en: 'The bot speaks natural Georgian and English. Every customer is served in their own language! 🇬🇪',
  },
  default: {
    ka: 'გამარჯობა! 👋 მე ვარ Peit AI. შემიძლია გიპასუხო ფასების, setup-ის, ფუნქციების ან ტრიალის შესახებ. რა გაინტერესებს?',
    en: 'Hello! 👋 I\'m Peit AI. I can answer questions about pricing, setup, features or trial. What would you like to know?',
  },
};

// Quick-reply chips at the top of the chat. `label` is what the user sees;
// `intent` is what we feed into the keyword router (the user could type the
// same intent in any phrasing, so keeping them decoupled is cleaner than
// the previous label-to-intent lookup table that broke on duplicate keys).
interface QuickReply { label: string; intent: string }

const quickReplies: Record<Lang, QuickReply[]> = {
  ka: [
    { label: '💰 ფასები',  intent: 'ფასები'  },
    { label: '⚙️ Setup',  intent: 'setup'   },
    { label: '📱 არხები',  intent: 'არხები'  },
    { label: '🎁 ტრიალი',  intent: 'ტრიალი'  },
  ],
  en: [
    { label: '💰 Pricing',  intent: 'pricing'  },
    { label: '⚙️ Setup',    intent: 'setup'    },
    { label: '📱 Channels', intent: 'channels' },
    { label: '🎁 Trial',    intent: 'trial'    },
  ],
};

const uiText: Record<Lang, {
  subtitle: string; online: string; placeholder: string;
  ctaBtn: string; ctaNote: string; greeting: string;
}> = {
  ka: {
    subtitle: 'AI ასისტენტი',
    online: 'ახლა ონლაინ',
    placeholder: 'შეტყობინება...',
    ctaBtn: 'უფასოდ სცადე →',
    ctaNote: 'საკრედიტო ბარათი არ სჭირდება',
    greeting: 'გამარჯობა! 👋 მე ვარ Peit AI. როგორ შემიძლია დაგეხმარო?',
  },
  en: {
    subtitle: 'AI assistant',
    online: 'Online now',
    placeholder: 'Type a message...',
    ctaBtn: 'Try Free →',
    ctaNote: 'No credit card required',
    greeting: 'Hello! 👋 I\'m Peit AI. How can I help you?',
  },
};

function getBotResponse(input: string, lang: Lang): string {
  const lower = input.toLowerCase();
  if (/ფა[სზ]|price|pricing|plan/i.test(lower)) return responses.pricing[lang];
  if (/setup|კონფი|install|დაყ|ინს/i.test(lower)) return responses.setup[lang];
  if (/არხ|channel|telegram|instagram|messenger|facebook/i.test(lower)) return responses.channels[lang];
  if (/trial|ტრი|უფასო|free/i.test(lower)) return responses.trial[lang];
  if (/ენ[აა]|language|georgian|ქართ|english/i.test(lower)) return responses.languages[lang];
  return responses.default[lang];
}

/** Brand monogram avatar — the gradient "p" from the peit wordmark, so the
 *  assistant carries the same logo as the rest of the site. */
function BotAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-9 h-9 text-[17px]' : 'w-6 h-6 text-[11px]';
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 select-none ring-1 ring-white/15`}>
      <span className="font-extrabold text-white leading-none tracking-[-0.04em] -translate-y-px">p</span>
    </div>
  );
}

export default function ChatWidget() {
  const { lang: ctxLang } = useLanguage();
  // Context may carry legacy values; the assistant only speaks ka/en.
  const lang: Lang = ctxLang === 'en' ? 'en' : 'ka';
  const ui = uiText[lang];

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>(() => [
    { id: 0, from: 'bot', text: uiText[lang].greeting },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [counter, setCounter] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset conversation when language changes — React 19 "derived state"
  // pattern. Calling setState during render is the recommended replacement
  // for the setState-in-effect anti-pattern: React detects the change,
  // discards the pending render, and re-renders with the new state.
  const [lastLang, setLastLang] = useState(lang);
  if (lastLang !== lang) {
    setLastLang(lang);
    setMsgs([{ id: 0, from: 'bot', text: uiText[lang].greeting }]);
    setCounter(1);
    setInput('');
    setTyping(false);
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const uid = counter;
    setCounter(c => c + 2);
    setInput('');
    setMsgs(prev => [...prev, { id: uid, from: 'user', text: msg }]);
    setTyping(true);
    // Length-based typing delay — deterministic, no Math.random which the
    // React purity linter flags. Capped so very long messages don't stall.
    const delay = 900 + Math.min(600, msg.length * 30);
    setTimeout(() => {
      const reply = getBotResponse(msg, lang);
      setTyping(false);
      setMsgs(prev => [...prev, { id: uid + 1, from: 'bot', text: reply }]);
    }, delay);
  }

  return (
    // Positioning notes:
    //   • bottom-24 on mobile keeps the launcher clear of the cookie-consent
    //     banner (which spans the bottom on small viewports).
    //   • bottom-8 on desktop sits a comfortable 32px from the edge.
    //   • The popup uses dvh-aware max-height so it never exceeds the visible
    //     viewport when the keyboard is open or the window is short.
    <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat popup */}
      {open && (
        <div
          className="rounded-2xl w-80 max-w-[calc(100vw-2rem)] shadow-2xl shadow-violet-900/40 border border-white/10 overflow-hidden flex flex-col bg-[#0d0d1a]/95 backdrop-blur-xl"
          style={{
            // Use dynamic viewport units so mobile browser chrome doesn't
            // push the panel off-screen. Falls back to 100vh on browsers
            // without dvh support.
            height:    '480px',
            maxHeight: 'min(480px, calc(100dvh - 8rem))',
          }}
        >

          {/* Header — brand wordmark + monogram avatar so the assistant
              visually belongs to the site. */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600/25 via-violet-600/10 to-transparent border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5">
              <BotAvatar />
              <div>
                <div className="flex items-baseline gap-1.5">
                  <Logo href={null} size="sm" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-violet-300/80">{ui.subtitle}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-gray-400">{ui.online}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors p-1" aria-label="close chat">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
            {msgs.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'bot' && (
                  <div className="mt-0.5">
                    <BotAvatar size="sm" />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.from === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-white/[0.07] text-gray-200 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2 justify-start">
                <div className="mt-0.5">
                  <BotAvatar size="sm" />
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

          {/* Quick replies */}
          {!typing && msgs.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {quickReplies[lang].map(qr => (
                <button
                  key={qr.intent}
                  onClick={() => send(qr.intent)}
                  className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/50 transition-colors"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input — width is locked to the row via flex-1 + min-w-0 so a
              long typed string never widens the panel (the row would
              otherwise honor the input's intrinsic min-width). text-base
              avoids the iOS Safari auto-zoom that triggers below 16px. */}
          <div className="border-t border-white/[0.06] px-3 py-3 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder={ui.placeholder}
              className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-base sm:text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              aria-label="გაგზავნა"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* CTA */}
          <div className="border-t border-white/[0.04] px-4 py-2.5 flex items-center justify-between shrink-0">
            <Link href="/signup"
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              {ui.ctaBtn}
            </Link>
            <p className="text-xs text-gray-600">{ui.ctaNote}</p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center ring-1 ring-white/20 shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-105 active:scale-95 transition-all"
        aria-label="გახსენი ჩატი"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageSquare className="w-6 h-6 text-white" />
        }
        {!open && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#07070f]" />
        )}
      </button>
    </div>
  );
}
