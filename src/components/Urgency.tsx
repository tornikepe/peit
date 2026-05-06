'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Urgency() {
  const { t } = useLanguage();
  const u = t.urgency;

  return (
    <section className="py-8 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-950/60 to-purple-950/40 border border-violet-500/20 px-8 py-16 text-center">
          <div className="absolute inset-0 hero-glow opacity-50 pointer-events-none" />

          <div className="relative">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
              {u.h2a}
              <br />
              <span className="gradient-text">{u.h2b}</span>
            </h2>
            <p className="text-gray-300 text-lg font-medium mb-2">{u.sub}</p>
            <p className="text-gray-500 text-sm max-w-xl mx-auto mb-8">{u.detail}</p>

            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-9 py-4 rounded-xl text-lg mb-6"
            >
              {u.cta}
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-gray-600 text-sm">{u.join}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
