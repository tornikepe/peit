'use client';

import { Upload, Globe, BarChart3 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const stepIcons = [Upload, Globe, BarChart3];

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
            {t.howItWorks.label}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {t.howItWorks.sub}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-violet-500/0" />

          {t.howItWorks.steps.map((step, i) => {
            const Icon = stepIcons[i];
            const num  = String(i + 1).padStart(2, '0');
            return (
              <div key={i} className="glass rounded-2xl p-8 flex flex-col gap-5 relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <span className="text-4xl font-bold text-white/10 select-none">{num}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed mb-4">{step.desc}</p>
                  <p className="text-xs text-violet-400 font-medium bg-violet-500/10 border border-violet-500/20 inline-block px-3 py-1 rounded-full">
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
