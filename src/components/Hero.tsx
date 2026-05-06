'use client';

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
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
    <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-violet-900/20 w-full max-w-sm mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{t.hero.chatName}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-gray-500">{t.hero.chatOnline}</p>
          </div>
        </div>
        <div className="ml-auto text-xs text-gray-600">{t.hero.chatAvg}</div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-2.5 min-h-[260px]">
        {msgs.map((msg, i) =>
          visible.includes(i) ? (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`rounded-2xl px-4 py-2.5 max-w-[82%] text-sm leading-relaxed ${
                msg.from === 'user'
                  ? 'bg-violet-600/80 text-white rounded-tr-sm'
                  : 'bg-white/[0.07] text-gray-300 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ) : null
        )}
        {typing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5">
          <span className="text-gray-600 text-sm flex-1">{t.hero.chatPlaceholder}</span>
          <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      <div className="hero-glow absolute inset-0 pointer-events-none" />
      <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT */}
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
              {t.hero.badge}
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-5">
              {t.hero.h1a}{" "}
              <span className="gradient-text">{t.hero.h1b}</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
              {t.hero.sub}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link href="/signup"
                className="btn-primary inline-flex items-center justify-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl text-base">
                {t.hero.cta1}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 text-gray-300 hover:text-white font-medium px-7 py-3.5 rounded-xl text-base border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all">
                {t.hero.cta2}
              </Link>
            </div>

            <p className="text-sm text-gray-600 mb-10">{t.hero.trust}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { v: t.hero.stat1v, l: t.hero.stat1l },
                { v: t.hero.stat2v, l: t.hero.stat2l },
                { v: t.hero.stat3v, l: t.hero.stat3l },
              ].map(({ v, l }) => (
                <div key={l}>
                  <p className="text-3xl font-bold text-white">{v}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex justify-center lg:justify-end">
            <AnimatedChat />
          </div>
        </div>
      </div>
    </section>
  );
}
