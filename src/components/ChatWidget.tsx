'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Zap, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

type Lang = 'ka' | 'en' | 'ru';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

const responses: Record<string, Record<Lang, string>> = {
  pricing: {
    ka: 'ჩვენ გვაქვს 4 პლანი: Starter ($19/თვე ~₾52), Pro ($49/თვე ~₾135), Business ($99/თვე ~₾273) და Enterprise. ყველა იწყება 7-დღიანი უფასო ტრიალით! 💜',
    en: 'We have 4 plans: Starter ($19/mo ~₾52), Pro ($49/mo ~₾135), Business ($99/mo ~₾273) and Enterprise. All start with a 7-day free trial! 💜',
    ru: 'У нас 4 плана: Starter ($19/мес ~₾52), Pro ($49/мес ~₾135), Business ($99/мес ~₾273) и Enterprise. Все начинаются с 7-дневного бесплатного триала! 💜',
  },
  setup: {
    ka: 'Setup ძალიან მარტივია! ატვირთე FAQ ფაილი ან შეიყვანე ვებსაიტის URL — ბოტი 10 წუთში მზადაა. კოდის ცოდნა საჭირო არ არის. 🚀',
    en: 'Setup is super easy! Upload a FAQ file or enter your website URL — bot is ready in 10 minutes. No coding required. 🚀',
    ru: 'Настройка очень простая! Загрузите FAQ-файл или введите URL сайта — бот готов за 10 минут. Знание кода не нужно. 🚀',
  },
  channels: {
    ka: 'Peit მუშაობს ყველა არხზე: ვებსაიტი, Telegram, Instagram, Facebook Messenger. ყველა საუბარი ერთ dashboard-ში! 📱',
    en: 'Peit works on all channels: website, Telegram, Instagram, Facebook Messenger. All conversations in one dashboard! 📱',
    ru: 'Peit работает на всех каналах: сайт, Telegram, Instagram, Facebook Messenger. Все разговоры в одном dashboard! 📱',
  },
  trial: {
    ka: 'დიახ! 7 დღე სრულიად უფასოდ — საკრედიტო ბარათი საჭირო არ არის. ტრიალის შემდეგ გადახვალ შენთვის სასურველ პლანზე. ✨',
    en: 'Yes! 7 days completely free — no credit card required. After the trial you choose the plan that suits you. ✨',
    ru: 'Да! 7 дней полностью бесплатно — кредитная карта не нужна. После триала выбираете подходящий план. ✨',
  },
  languages: {
    ka: 'ბოტი ბუნებრივ ქართულად, ინგლისურად და რუსულად საუბრობს. ყოველი კლიენტი საკუთარ ენაზე ემსახურება! 🇬🇪',
    en: 'The bot speaks natural Georgian, English, and Russian. Every customer is served in their own language! 🇬🇪',
    ru: 'Бот говорит на естественном грузинском, английском и русском языках. Каждый клиент обслуживается на своём языке! 🇬🇪',
  },
  default: {
    ka: 'გამარჯობა! 👋 მე ვარ Peit AI. შემიძლია გიპასუხო ფასების, setup-ის, ფუნქციების ან ტრიალის შესახებ. რა გაინტერესებს?',
    en: 'Hello! 👋 I\'m Peit AI. I can answer questions about pricing, setup, features or trial. What would you like to know?',
    ru: 'Привет! 👋 Я Peit AI. Могу ответить на вопросы о ценах, настройке, функциях или триале. Что вас интересует?',
  },
};

const quickReplies: Record<Lang, string[]> = {
  ka: ['💰 ფასები', '⚙️ Setup', '📱 არხები', '🎁 ტრიალი'],
  en: ['💰 Pricing', '⚙️ Setup', '📱 Channels', '🎁 Trial'],
  ru: ['💰 Цены', '⚙️ Настройка', '📱 Каналы', '🎁 Триал'],
};

const uiText: Record<Lang, {
  name: string; online: string; placeholder: string;
  ctaBtn: string; ctaNote: string; greeting: string;
}> = {
  ka: {
    name: 'Peit AI',
    online: 'ახლა ონლაინ',
    placeholder: 'შეტყობინება...',
    ctaBtn: 'უფასოდ სცადე →',
    ctaNote: 'საკრედიტო ბარათი არ სჭირდება',
    greeting: 'გამარჯობა! 👋 მე ვარ Peit AI. როგორ შეგიძლია დაგეხმარო?',
  },
  en: {
    name: 'Peit AI',
    online: 'Online now',
    placeholder: 'Type a message...',
    ctaBtn: 'Try Free →',
    ctaNote: 'No credit card required',
    greeting: 'Hello! 👋 I\'m Peit AI. How can I help you?',
  },
  ru: {
    name: 'Peit AI',
    online: 'Онлайн',
    placeholder: 'Написать сообщение...',
    ctaBtn: 'Попробовать →',
    ctaNote: 'Карта не нужна',
    greeting: 'Привет! 👋 Я Peit AI. Как могу помочь?',
  },
};

function getBotResponse(input: string, lang: Lang): string {
  const lower = input.toLowerCase();
  if (/ფა[სზ]|price|pricing|plan|пла[нь]|цен/i.test(lower)) return responses.pricing[lang];
  if (/setup|კონფი|настр|install|დაყ|ინს/i.test(lower)) return responses.setup[lang];
  if (/არხ|channel|каналмессенд|telegram|instagram|messenger|facebook/i.test(lower)) return responses.channels[lang];
  if (/trial|ტრი|триал|უფასო|free|бесплат/i.test(lower)) return responses.trial[lang];
  if (/ენ[აა]|language|язык|georgian|ქართ|рус|english/i.test(lower)) return responses.languages[lang];
  return responses.default[lang];
}

export default function ChatWidget() {
  const { lang } = useLanguage();
  const ui = uiText[lang];

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [counter, setCounter] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset greeting when language changes
  useEffect(() => {
    setMsgs([{ id: 0, from: 'bot', text: uiText[lang].greeting }]);
  }, [lang]);

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
    setTimeout(() => {
      const reply = getBotResponse(msg, lang);
      setTyping(false);
      setMsgs(prev => [...prev, { id: uid + 1, from: 'bot', text: reply }]);
    }, 900 + Math.random() * 600);
  }

  const quickReplyLabels: Record<string, string> = {
    '💰 ფასები': 'ფასები', '⚙️ Setup': 'setup', '📱 არხები': 'არხები', '🎁 ტრიალი': 'ტრიალი',
    '💰 Pricing': 'pricing', '⚙️ Setup ': 'setup', '📱 Channels': 'channels', '🎁 Trial': 'trial',
    '💰 Цены': 'цены', '⚙️ Настройка': 'настройка', '📱 Каналы': 'каналы', '🎁 Триал': 'триал',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat popup */}
      {open && (
        <div className="glass rounded-2xl w-80 shadow-2xl shadow-violet-900/40 border border-white/10 overflow-hidden flex flex-col"
          style={{ height: '460px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-violet-600/20 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{ui.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-gray-400">{ui.online}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
            {msgs.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
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
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
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
                  key={qr}
                  onClick={() => send(quickReplyLabels[qr] ?? qr)}
                  className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/[0.06] px-3 py-3 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder={ui.placeholder}
              className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
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
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-105 transition-all"
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
