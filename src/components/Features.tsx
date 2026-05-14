'use client';

import { Zap, Globe, BarChart3, Users, MessageSquare, Clock, Shield, Plug, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const icons = [Clock, MessageSquare, Globe, Users, BarChart3, Plug, Zap, Shield];

const accents = [
  { text: "text-violet-300",  bg: "bg-violet-500/10",  ring: "ring-violet-500/20",  glow: "shadow-violet-500/20" },
  { text: "text-cyan-300",    bg: "bg-cyan-500/10",    ring: "ring-cyan-500/20",    glow: "shadow-cyan-500/20" },
  { text: "text-emerald-300", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", glow: "shadow-emerald-500/20" },
  { text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20",   glow: "shadow-amber-500/20" },
  { text: "text-rose-300",    bg: "bg-rose-500/10",    ring: "ring-rose-500/20",    glow: "shadow-rose-500/20" },
  { text: "text-sky-300",     bg: "bg-sky-500/10",     ring: "ring-sky-500/20",     glow: "shadow-sky-500/20" },
  { text: "text-purple-300",  bg: "bg-purple-500/10",  ring: "ring-purple-500/20",  glow: "shadow-purple-500/20" },
  { text: "text-teal-300",    bg: "bg-teal-500/10",    ring: "ring-teal-500/20",    glow: "shadow-teal-500/20" },
];

export default function Features() {
  const { t } = useLanguage();

  return (
    <section id="features" className="relative py-28 px-4 sm:px-6 border-t border-white/[0.06] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-violet-600/[0.06] blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-3 py-1 mb-5">
            <Zap className="w-3 h-3 text-violet-300" />
            <p className="text-violet-300 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t.features.label}
            </p>
          </span>
          <h2 className="text-[2.25rem] sm:text-[3rem] font-bold text-white tracking-[-0.02em] mb-4 leading-[1.1]">
            {t.features.title}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            {t.features.sub}
          </p>
        </div>

        {/* Bento grid — first card spans 2 cols on lg for visual rhythm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {t.features.items.map((f, i) => {
            const Icon = icons[i];
            const a    = accents[i % accents.length];
            const featured = i === 0; // first card spans wider on lg

            return (
              <div
                key={i}
                className={`group relative glass rounded-2xl p-6 flex flex-col gap-4 hover:border-violet-500/30 transition-all overflow-hidden ${
                  featured ? 'lg:col-span-2' : ''
                }`}
              >
                {/* Hover glow */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${a.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                <div className="flex items-start justify-between relative">
                  <div className={`${a.bg} ${a.text} w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${a.ring} group-hover:scale-110 group-hover:shadow-lg ${a.glow} transition-all`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                </div>

                <div className="relative">
                  <h3 className="text-white font-semibold text-[15px] mb-1.5 leading-snug">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
