'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Urgency() {
  const { t } = useLanguage();
  const u = t.urgency;

  return (
    <section className="py-12 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-violet-900/40 via-purple-950/30 to-cyan-950/20 border border-violet-500/25 px-6 sm:px-12 py-16 sm:py-20 text-center">
          {/* Layered backdrop */}
          <div className="mesh-bg absolute inset-0 opacity-60 pointer-events-none" />
          <div className="dot-grid absolute inset-0 opacity-50 pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <h2 className="text-[2.25rem] sm:text-[3rem] lg:text-[3.75rem] font-bold text-white mb-4 leading-[1.05] tracking-[-0.025em]">
              {u.h2a}
              <br />
              <span className="gradient-text">{u.h2b}</span>
            </h2>
            <p className="text-gray-200/90 text-lg sm:text-xl font-medium mb-2 max-w-2xl mx-auto">{u.sub}</p>
            <p className="text-gray-400 text-sm max-w-xl mx-auto mb-10">{u.detail}</p>

            <Link
              href="/signup"
              className="btn-primary group inline-flex items-center gap-2 text-white font-semibold px-9 py-4 rounded-2xl text-base sm:text-lg mb-8 cursor-pointer"
            >
              {u.cta}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
              <div className="flex -space-x-1.5">
                {["from-violet-500 to-purple-700", "from-cyan-500 to-blue-700", "from-emerald-500 to-teal-700", "from-rose-500 to-pink-700"].map((g, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#07070f]`} />
                ))}
              </div>
              <p>{u.join}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
