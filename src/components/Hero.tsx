'use client';

import Link from "next/link";
import { ArrowRight, Zap, Sparkles, MessageSquare, Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

// Hero chat preview — replyory.com-style cycling demo.
//
// Each language has multiple sample conversations (delivery, hotel
// booking, fitness membership). Every conversation has the same shape:
// a bot greeting → user question → bot answer → user follow-up → bot
// answer. Once the bot's last reply has been on screen for a beat, the
// card wipes and the next conversation starts — so the visitor sees
// fresh content on every loop instead of the same dialogue replayed.
//
// The card itself is a FIXED size (panel + 480px message column +
// input row), so the height never changes as messages fade in.
// Overflow is clipped — long replies just push older messages out of
// view inside the bordered area. No layout shift on the outer page.

type Msg = { from: 'bot' | 'user'; text: string };
type Conv = Msg[];

const conversationsKa: Conv[] = [
  [
    { from: 'bot',  text: 'გამარჯობა! როგორ შეგიძლიათ დაგეხმაროთ? 👋' },
    { from: 'user', text: 'მინდა ვიცოდე მიტანის ფასები' },
    { from: 'bot',  text: 'თბილისში მიტანა ₾3, ბათუმში — ₾8. ₾100-ზე მეტი შეკვეთისას უფასოა! 🚚' },
    { from: 'user', text: 'რამდენ ხანს იღებს?' },
    { from: 'bot',  text: 'თბილისში 45-90 წუთი. ბათუმში მეორე დღეს. 📦' },
  ],
  [
    { from: 'bot',  text: 'მოგესალმებით! რით შემიძლია დაგეხმაროთ? 🏨' },
    { from: 'user', text: 'ხელმისაწვდომი ნომრები გაქვთ შაბათ-კვირას?' },
    { from: 'bot',  text: 'დიახ — Deluxe ნომერი ₾280/ღამეში, აუზის ხედით. 🌅' },
    { from: 'user', text: 'შემიძლია ახლა დავაჯავშნო?' },
    { from: 'bot',  text: 'რა თქმა უნდა! სახელი + ნომერი მომწერეთ — დადასტურდება 2 წუთში. ✅' },
  ],
  [
    { from: 'bot',  text: 'გამარჯობა! 💪 რა გაინტერესებთ?' },
    { from: 'user', text: 'წევრობის ფასები' },
    { from: 'bot',  text: 'თვიური ₾80, 3-თვიური ₾210, წლიური ₾720. პერსონალური მწვრთნელი — დამატებითი. 🏋️' },
    { from: 'user', text: 'შემიძლია სცადო?' },
    { from: 'bot',  text: 'პირველი ვიზიტი უფასოა! დაჯავშნე drop-in ერთ-ერთ ჩვენ კლუბში. 🎁' },
  ],
];

const conversationsEn: Conv[] = [
  [
    { from: 'bot',  text: 'Hi! How can I help you today? 👋' },
    { from: 'user', text: 'What are your delivery prices?' },
    { from: 'bot',  text: 'Tbilisi: ₾3, Batumi: ₾8. Free on orders over ₾100! 🚚' },
    { from: 'user', text: 'How long does delivery take?' },
    { from: 'bot',  text: 'Tbilisi: 45-90 min. Batumi: next day. 📦' },
  ],
  [
    { from: 'bot',  text: 'Welcome! How can I help? 🏨' },
    { from: 'user', text: 'Any rooms available this weekend?' },
    { from: 'bot',  text: 'Yes — Deluxe room at ₾280/night with pool view. 🌅' },
    { from: 'user', text: 'Can I book now?' },
    { from: 'bot',  text: 'Absolutely! Send your name + phone — confirmed in 2 minutes. ✅' },
  ],
  [
    { from: 'bot',  text: 'Hi there! 💪 What would you like to know?' },
    { from: 'user', text: 'Membership pricing?' },
    { from: 'bot',  text: 'Monthly ₾80, 3-month ₾210, annual ₾720. Personal training extra. 🏋️' },
    { from: 'user', text: 'Can I try it first?' },
    { from: 'bot',  text: 'Your first visit is free! Drop in at any of our clubs. 🎁' },
  ],
];

const conversationsRu: Conv[] = [
  [
    { from: 'bot',  text: 'Привет! Чем могу помочь? 👋' },
    { from: 'user', text: 'Сколько стоит доставка?' },
    { from: 'bot',  text: 'Тбилиси: ₾3, Батуми: ₾8. Бесплатно от ₾100! 🚚' },
    { from: 'user', text: 'Как долго ждать?' },
    { from: 'bot',  text: 'Тбилиси: 45-90 мин. Батуми: на следующий день. 📦' },
  ],
  [
    { from: 'bot',  text: 'Добро пожаловать! Чем могу помочь? 🏨' },
    { from: 'user', text: 'Есть свободные номера на выходные?' },
    { from: 'bot',  text: 'Да — Deluxe ₾280/ночь с видом на бассейн. 🌅' },
    { from: 'user', text: 'Могу забронировать сейчас?' },
    { from: 'bot',  text: 'Конечно! Пришлите имя + телефон — подтвердим за 2 минуты. ✅' },
  ],
  [
    { from: 'bot',  text: 'Привет! 💪 Что вас интересует?' },
    { from: 'user', text: 'Цены на абонемент' },
    { from: 'bot',  text: 'Месяц ₾80, 3 месяца ₾210, год ₾720. Тренер — отдельно. 🏋️' },
    { from: 'user', text: 'Можно попробовать?' },
    { from: 'bot',  text: 'Первое посещение бесплатно! Заходите в любой наш клуб. 🎁' },
  ],
];

const SCROLL_ENABLED = true;

// Per-step delays. Tuned to feel natural without dragging.
const DELAY_USER       = 1100;   // gap before user's message appears
const DELAY_BOT_FIRST  = 600;    // gap before the initial bot greeting
const DELAY_TYPING     = 1100;   // length of the "..." typing indicator
const DELAY_AFTER_LAST = 3500;   // pause once the conversation ends
const DELAY_WIPE       = 450;    // blank-card pause between conversations

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function AnimatedChat() {
  const { lang, t } = useLanguage();
  const conversations =
    lang === 'en' ? conversationsEn
    : lang === 'ru' ? conversationsRu
    : conversationsKa;

  const [convoIdx, setConvoIdx]   = useState(0);
  const [shown,    setShown]      = useState(0);
  const [typing,   setTyping]     = useState(false);
  const scrollRef                 = useRef<HTMLDivElement>(null);

  // Reset when the visitor changes language — keeps copy and state in sync.
  const [lastLang, setLastLang] = useState(lang);
  if (lastLang !== lang) {
    setLastLang(lang);
    setConvoIdx(0);
    setShown(0);
    setTyping(false);
  }

  // Drive the animation. Effect re-runs each time a conversation finishes
  // (convoIdx changes), playing through the whole script from message 0 to
  // the end, then bumping to the next conversation.
  useEffect(() => {
    let cancelled = false;
    const conv = conversations[convoIdx];

    (async () => {
      // Brief blank pause at the start of each cycle, so the previous
      // conversation has a chance to feel "wiped".
      await sleep(DELAY_WIPE);
      if (cancelled) return;
      setShown(0);
      setTyping(false);

      for (let i = 0; i < conv.length; i++) {
        if (cancelled) return;
        const msg = conv[i];

        // Bot replies (after the greeting) get a typing indicator first.
        if (msg.from === 'bot' && i > 0) {
          setTyping(true);
          await sleep(DELAY_TYPING);
          if (cancelled) return;
          setTyping(false);
        } else {
          await sleep(msg.from === 'user' ? DELAY_USER : DELAY_BOT_FIRST);
          if (cancelled) return;
        }

        setShown(i + 1);
      }

      // Hold the completed conversation on screen, then advance.
      await sleep(DELAY_AFTER_LAST);
      if (cancelled) return;
      setConvoIdx(prev => (prev + 1) % conversations.length);
    })();

    return () => { cancelled = true; };
  // We intentionally don't depend on `conversations` because it's recomputed
  // on every render from `lang`; the lang-change branch above resets state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convoIdx, lang]);

  // Auto-scroll the message column to the bottom as new bubbles appear.
  useEffect(() => {
    if (!SCROLL_ENABLED) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [shown, typing]);

  const conv = conversations[convoIdx];
  const visibleMsgs = conv.slice(0, shown);

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Glow behind card */}
      <div className="absolute -inset-6 bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-cyan-400/20 rounded-3xl blur-2xl opacity-60 animate-glow-pulse pointer-events-none" />

      {/* Floating accent badges around the card */}
      <div className="absolute -top-3 -left-3 z-10 hidden sm:flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        AI ცოცხალია
      </div>
      <div className="absolute -bottom-3 -right-3 z-10 hidden sm:flex items-center gap-1.5 bg-violet-500/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-violet-500/30">
        <Sparkles className="w-3 h-3" />
        Real-time
      </div>

      <div className="relative glass-strong rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(20,184,166,0.4)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 ring-2 ring-[#0d0d1a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t.hero.chatName}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-500">{t.hero.chatOnline}</p>
            </div>
          </div>
          <div className="ml-auto text-[10px] text-gray-600 font-mono">{t.hero.chatAvg}</div>
        </div>

        {/* Messages — fixed height; auto-scrolls to bottom on each new bubble. */}
        <div
          ref={scrollRef}
          className="p-5 space-y-3 h-[420px] overflow-y-auto scroll-smooth bg-gradient-to-b from-transparent to-violet-950/10"
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleMsgs.map((msg, i) => (
            <div
              key={`${convoIdx}-${i}`}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[82%] text-sm leading-relaxed shadow-sm ${
                  msg.from === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-tr-sm'
                    : 'bg-white/[0.08] text-gray-200 rounded-tl-sm ring-1 ring-white/[0.04]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/[0.08] ring-1 ring-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input — visual only; the real chat lives in the floating widget. */}
        <div className="px-5 pb-5 pt-2">
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3">
            <span className="text-gray-500 text-sm flex-1 truncate">{t.hero.chatPlaceholder}</span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-500/40 shrink-0">
              <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Layered background — drifting aurora + mesh + dot grid.
          aurora adds two slowly-orbiting blobs (violet + cyan) behind
          everything else, which keeps the hero alive without animating
          anything heavyweight. */}
      <div className="aurora" />
      <div className="mesh-bg absolute inset-0 pointer-events-none opacity-70" />
      <div className="dot-grid absolute inset-0 pointer-events-none" />

      {/* Floating orbs — kept as subtle highlights on top of the aurora.
          Cyan + fuchsia accents brighten the corners. */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-violet-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-40 right-[15%] w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none animate-float-slower" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '4s' }} />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT */}
          <div>
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.08] backdrop-blur-sm px-3.5 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
              </span>
              <p className="text-amber-200 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {t.hero.badge}
              </p>
            </div>

            {/* Headline — fluid scale so it never overflows on mobile */}
            <h1
              className="font-bold text-white leading-[1.06] tracking-[-0.025em] mb-6 break-words"
              style={{ fontSize: 'clamp(2.125rem, 6.5vw, 4rem)' }}
            >
              {t.hero.h1a}
              <br />
              {/* Slow shimmer slide over the accent line — gives the
                  most prominent text a subtle aliveness without being
                  distracting on read. */}
              <span className="shimmer-text">{t.hero.h1b}</span>
            </h1>

            <p className="text-[1rem] sm:text-lg text-gray-300/80 leading-[1.65] mb-8 max-w-lg">
              {t.hero.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link href="/signup"
                className="btn-primary group inline-flex items-center justify-center gap-2 text-white font-semibold px-7 py-4 rounded-2xl text-[0.95rem] cursor-pointer">
                {t.hero.cta1}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 text-gray-200 hover:text-white font-medium px-7 py-4 rounded-2xl text-[0.95rem] border border-white/10 hover:border-white/30 hover:bg-white/[0.04] backdrop-blur-sm transition-all cursor-pointer">
                {t.hero.cta2}
              </Link>
            </div>

            <p className="text-sm text-gray-500 mb-12 flex items-center gap-2">
              <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500/20 items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
              {t.hero.trust}
            </p>

            {/* Stats — now with icons */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md">
              {[
                { v: t.hero.stat1v, l: t.hero.stat1l, icon: <Bot className="w-4 h-4 text-violet-400" /> },
                { v: t.hero.stat2v, l: t.hero.stat2l, icon: <MessageSquare className="w-4 h-4 text-cyan-400" /> },
                { v: t.hero.stat3v, l: t.hero.stat3l, icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
              ].map(({ v, l, icon }) => (
                <div key={l} className="relative group">
                  <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>
                  <p className="text-[1.75rem] sm:text-3xl font-bold text-white leading-none mb-1.5 tracking-tight">{v}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-snug">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — animated chat preview */}
          <div className="flex justify-center lg:justify-end">
            <AnimatedChat />
          </div>
        </div>
      </div>

      {/* Bottom fade-out into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#07070f] pointer-events-none" />
    </section>
  );
}
