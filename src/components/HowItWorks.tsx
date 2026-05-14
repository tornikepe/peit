'use client';

import { Upload, Globe, BarChart3, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const stepIcons = [Upload, Globe, BarChart3];
const stepAccents = [
  { ring: "ring-violet-500/30", bg: "bg-violet-500/[0.08]", text: "text-violet-300", glow: "shadow-violet-500/25" },
  { ring: "ring-cyan-500/30",   bg: "bg-cyan-500/[0.08]",   text: "text-cyan-300",   glow: "shadow-cyan-500/25" },
  { ring: "ring-emerald-500/30", bg: "bg-emerald-500/[0.08]", text: "text-emerald-300", glow: "shadow-emerald-500/25" },
];

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="relative py-28 px-4 sm:px-6 border-t border-white/[0.06] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/[0.05] blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/[0.08] px-3 py-1 mb-5">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <p className="text-cyan-300 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t.howItWorks.label}
            </p>
          </span>
          <h2 className="text-[2.25rem] sm:text-[3rem] font-bold text-white tracking-[-0.02em] mb-4 leading-[1.1]">
            {t.howItWorks.title}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            {t.howItWorks.sub}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {/* Animated gradient flow line behind cards on desktop */}
          <div className="hidden md:block absolute top-14 left-[16%] right-[16%] h-px bg-gradient-to-r from-violet-500/0 via-violet-500/40 via-cyan-500/40 to-emerald-500/0" />

          {t.howItWorks.steps.map((step, i) => {
            const Icon = stepIcons[i];
            const num  = i + 1;
            const a    = stepAccents[i];
            return (
              <div
                key={i}
                className="group relative glass rounded-3xl p-7 flex flex-col gap-5 hover:border-white/[0.12] transition-all overflow-hidden"
              >
                {/* corner glow on hover */}
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full ${a.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                <div className="relative flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center ${a.text} group-hover:scale-105 group-hover:shadow-lg ${a.glow} transition-all`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <span className={`text-5xl font-bold ${a.text} opacity-25 leading-none select-none font-mono`}>{num}</span>
                </div>

                <div className="relative">
                  <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-gray-300/80 leading-relaxed text-[15px] mb-4">{step.desc}</p>
                  <p className={`text-xs font-medium ${a.text} ${a.bg} ring-1 ${a.ring} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full`}>
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
