'use client';

import Link from "next/link";
import { Check, Zap, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PricingCheckoutButton from "./PricingCheckoutButton";

/** Plan name (i18n) → internal slug used by Lemon Squeezy checkout. */
function planSlug(name: string): 'basic' | 'pro' | 'ultimate' | null {
  const n = name.toLowerCase();
  if (n.includes('basic'))    return 'basic';
  if (n.includes('ultimate')) return 'ultimate';
  if (n.includes('pro'))      return 'pro';
  return null;
}

export default function Pricing() {
  const { t } = useLanguage();
  const p = t.pricing;

  return (
    <section
      id="pricing"
      className="relative py-28 px-4 sm:px-6 border-t border-white/[0.06] overflow-hidden"
    >
      {/* Ambient mesh — two slowly-drifting blobs behind the cards. The
          `.aurora` utility paints these via ::before / ::after; we layer a
          smaller centered violet glow on top for warmth around the Pro
          card specifically. */}
      <div className="aurora opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/[0.10] blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-3 py-1 mb-5">
            <Sparkles className="w-3 h-3 text-violet-300" />
            <p className="text-violet-300 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {p.label}
            </p>
          </span>
          <h2 className="text-[2.25rem] sm:text-[3rem] font-bold text-white tracking-[-0.02em] mb-4 leading-[1.1]">
            {p.title}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            {p.sub}
          </p>
        </div>

        {/* Comparison banner */}
        <div className="glass rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div className="text-center sm:text-left">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{p.compLeftLabel}</p>
            <p className="text-2xl font-bold text-white/80 line-through decoration-red-400/60 decoration-2 underline-offset-4">~₾4,500/თვე</p>
          </div>
          <div className="text-2xl font-bold text-gray-700">vs</div>
          <div className="text-center sm:text-right">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{p.compRightLabel}</p>
            <p className="text-2xl font-bold gradient-text">₾65/თვე</p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {p.plans.map((plan) => {
            const slug = planSlug(plan.name);
            return (
              <div
                key={plan.name}
                /* Hover lift applies to every card; the highlighted plan
                   layers on a slowly-rotating gradient border (.gradient-
                   border) plus an ambient fuchsia/violet glow halo
                   (.popular-glow). The two pseudo-elements stack without
                   touching the markup. */
                className={`rounded-3xl p-8 flex flex-col gap-7 relative hover-lift ${
                  plan.highlight
                    ? 'gradient-border popular-glow bg-gradient-to-b from-violet-600/[0.22] via-violet-700/[0.10] to-violet-900/[0.05] md:scale-[1.04]'
                    : 'glass'
                }`}
              >
                {plan.highlight && 'badge' in plan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white text-[11px] font-bold tracking-wider px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/40 whitespace-nowrap uppercase">
                      {(plan as typeof plan & { badge: string }).badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-violet-300 uppercase tracking-wider">{plan.name}</p>
                    {plan.name === 'Basic' && (
                      <span className="text-[10px] font-bold text-amber-300 border border-amber-400/30 bg-amber-400/[0.08] px-2 py-1 rounded-full uppercase tracking-wider">
                        {p.trialBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[3.25rem] font-bold text-white leading-none tracking-[-0.03em]">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mt-3">{plan.desc}</p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.highlight
                          ? 'bg-violet-500/20 ring-1 ring-violet-500/40'
                          : 'bg-white/[0.04] ring-1 ring-white/[0.06]'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? 'text-violet-300' : 'text-violet-400'}`} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2.5">
                  {slug ? (
                    <PricingCheckoutButton
                      plan={slug}
                      label={plan.cta}
                      highlight={plan.highlight}
                    />
                  ) : (
                    <Link
                      href={plan.href}
                      className={`w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        plan.highlight
                          ? 'btn-primary text-white'
                          : 'border border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                  <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-gray-500" />
                    {p.cancel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise — full width */}
        <div className="glass rounded-3xl p-7 hover:border-violet-500/20 transition-all mb-8 mt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[13px] font-semibold text-violet-300 uppercase tracking-wider">Enterprise</p>
                <span className="text-[10px] border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  {p.enterprise.badge}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-1.5">{p.enterprise.title}</p>
              <p className="text-gray-400 text-sm max-w-xl leading-relaxed">{p.enterprise.desc}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                {p.enterpriseFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:info@peit.ge?subject=Enterprise"
                className="inline-flex items-center gap-2 btn-primary text-white font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap cursor-pointer"
              >
                {p.enterprise.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          {p.payment}
        </p>
      </div>
    </section>
  );
}
