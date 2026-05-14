'use client';

import Link from "next/link";
import { ArrowRight, Zap, Sparkles, MessageSquare, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const chatMessagesKa = [
  { from: "bot",  text: "გამარჯობა! როგორ შეგიძლიათ დაგეხმაროთ? 👋", delay: 0 },
  { from: "user", text: "მინდა ვიცოდე მიტანის ფასები",               delay: 1400 },
  { from: "bot",  text: "თბილისში მიტანა ₾3, ბათუმში — ₾8. ₾100-ზე მეტი შეკვეთისას უფასოა! 🚚", delay: 3000 },
  { from: "user", text: "რამდენ ხანს იღებს?",                         delay: 4600 },
  { from: "bot",  text: "თბილისში 45-90 წუთი. ბათუმში მეორე დღეს. 📦", delay: 6000 },
];

const chatMessagesEn = [
  { from: "bot",  text: "Hi! How can I help you today? 👋",           delay: 0 },
  { from: "user", text: "What are your delivery prices?",             delay: 1400 },
  { from: "bot",  text: "Tbilisi: ₾3, Batumi: ₾8. Free on orders over ₾100! 🚚", delay: 3000 },
  { from: "user", text: "How long does delivery take?",               delay: 4600 },
  { from: "bot",  text: "Tbilisi: 45-90 min. Batumi: next day. 📦",  delay: 6000 },
];

const chatMessagesRu = [
  { from: "bot",  text: "Привет! Чем могу помочь? 👋",               delay: 0 },
  { from: "user", text: "Сколько стоит доставка?",                   delay: 1400 },
  { from: "bot",  text: "Тбилиси: ₾3, Батуми: ₾8. Бесплатно от ₾100! 🚚", delay: 3000 },
  { from: "user", text: "Как долго ждать?",                           delay: 4600 },
  { from: "bot",  text: "Тбилиси: 45-90 мин. Батуми: на следующий день. 📦", delay: 6000 },
];

function AnimatedChat() {
  const { lang, t } = useLanguage();
  const msgs = lang === 'en' ? chatMessagesEn : lang === 'ru' ? chatMessagesRu : chatMessagesKa;

  const [visible, setVisible] = useState<number[]>([]);
  const [typing,  setTyping]  = useState(false);

  const playSequence = (messages: typeof msgs) => {
    setVisible([]);
    setTyping(false);
    messages.forEach((msg, i) => {
      setTimeout(() => {
        if (msg.from === 'bot' && i > 0) {
          setTyping(true);
          setTimeout(() => {
            setTyping(false);
            setVisible(v => [...v, i]);
          }, 800);
        } else {
          setVisible(v => [...v, i]);
        }
      }, msg.delay);
    });
  };

  useEffect(() => {
    playSequence(msgs);
    const loop = setInterval(() => playSequence(msgs), 10000);
    return () => clearInterval(loop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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

      <div className="relative glass-strong rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(124,58,237,0.4)]">
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

        {/* Messages */}
        <div className="p-5 space-y-3 min-h-[280px] bg-gradient-to-b from-transparent to-violet-950/10">
          {msgs.map((msg, i) =>
            visible.includes(i) ? (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`rounded-2xl px-4 py-2.5 max-w-[82%] text-sm leading-relaxed shadow-sm ${
                  msg.from === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-tr-sm'
                    : 'bg-white/[0.08] text-gray-200 rounded-tl-sm ring-1 ring-white/[0.04]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ) : null
          )}
          {typing && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/[0.08] ring-1 ring-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3">
            <span className="text-gray-500 text-sm flex-1">{t.hero.chatPlaceholder}</span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-500/40">
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
      {/* Layered background — mesh gradient + dot grid + floating orbs */}
      <div className="mesh-bg absolute inset-0 pointer-events-none opacity-90" />
      <div className="dot-grid absolute inset-0 pointer-events-none" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-40 right-[15%] w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none animate-float-slower" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '4s' }} />

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
              <span className="gradient-text">{t.hero.h1b}</span>
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
