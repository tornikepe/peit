'use client';

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function FAQ() {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(0);

  // JSON-LD FAQ schema — boosts AI citation rates (Princeton GEO study +40%)
  // and unlocks rich snippets in Google.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section id="faq" className="relative py-28 px-4 sm:px-6 border-t border-white/[0.06] overflow-hidden">
      {/* JSON-LD for AI search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/[0.06] blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-3 py-1 mb-5">
            <HelpCircle className="w-3 h-3 text-violet-300" />
            <p className="text-violet-300 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t.faq.label}
            </p>
          </span>
          <h2 className="text-[2.25rem] sm:text-[3rem] font-bold text-white tracking-[-0.02em] mb-4 leading-[1.1]">
            {t.faq.title}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            {t.faq.contactPre}{" "}
            <a
              href="mailto:info@peit.ge"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-4 decoration-violet-500/40 hover:decoration-violet-300 transition-colors"
            >
              {t.faq.contactLink}
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {t.faq.items.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? 'bg-gradient-to-b from-violet-500/[0.08] to-transparent border border-violet-500/30'
                    : 'glass'
                }`}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 cursor-pointer group"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className={`font-medium text-[15px] transition-colors ${isOpen ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                    {faq.q}
                  </span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isOpen
                      ? 'bg-violet-500/20 ring-1 ring-violet-500/40 rotate-180'
                      : 'bg-white/[0.04] ring-1 ring-white/[0.06] group-hover:bg-white/[0.08]'
                  }`}>
                    <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-violet-300' : 'text-gray-400'}`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 animate-fade-in">
                    <p className="text-gray-300 leading-[1.7] text-[15px]">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
