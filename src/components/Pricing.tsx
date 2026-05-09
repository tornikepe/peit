'use client';

import Link from "next/link";
import { Check, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PricingCheckoutButton from "./PricingCheckoutButton";

/** Plan name (i18n) → internal slug used by Stripe checkout. */
function planSlug(name: string): 'starter' | 'pro' | 'business' | null {
  const n = name.toLowerCase();
  if (n.includes('starter')) return 'starter';
  if (n.includes('pro'))     return 'pro';
  if (n.includes('business')) return 'business';
  return null;
}

export default function Pricing() {
  const { t } = useLanguage();
  const p = t.pricing;

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">
            {p.label}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {p.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{p.sub}</p>
        </div>

        {/* Comparison banner */}
        <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="text-center sm:text-left">
            <p className="text-gray-500 text-sm">{p.compLeftLabel}</p>
            <p className="text-2xl font-bold text-white">₾4,500/თვეში</p>
          </div>
          <div className="text-3xl font-bold text-gray-700">vs</div>
          <div className="text-center sm:text-right">
            <p className="text-gray-500 text-sm">{p.compRightLabel}</p>
            <p className="text-2xl font-bold gradient-text">₾349/თვეში</p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {p.plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col gap-6 relative ${
                plan.highlight
                  ? 'bg-gradient-to-b from-violet-600/20 to-purple-900/10 border border-violet-500/40 shadow-2xl shadow-violet-900/30'
                  : 'glass'
              }`}
            >
              {plan.highlight && 'badge' in plan && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/30 whitespace-nowrap">
                    {(plan as typeof plan & { badge: string }).badge}
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-violet-400 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                {/* Trial badge on Starter */}
                {!plan.highlight && plan.name === 'Starter' && (
                  <div className="mt-2 mb-2">
                    <span className="text-xs font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-wide">
                      {p.trialBadge}
                    </span>
                  </div>
                )}
                <p className="text-gray-400 text-sm mt-1">{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                {(() => {
                  const slug = planSlug(plan.name);
                  return slug ? (
                    <PricingCheckoutButton
                      plan={slug}
                      label={plan.cta}
                      highlight={plan.highlight}
                    />
                  ) : (
                    <Link
                      href={plan.href}
                      className={`w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all ${
                        plan.highlight
                          ? 'btn-primary text-white'
                          : 'border border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  );
                })()}
                <p className="text-center text-xs text-gray-600 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
                  {p.cancel}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise — full width */}
        <div className="glass rounded-2xl p-7 border border-white/[0.08] hover:border-violet-500/20 transition-all mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-semibold text-violet-400">Enterprise</p>
                <span className="text-xs border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-full">
                  {p.enterprise.badge}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{p.enterprise.title}</p>
              <p className="text-gray-400 text-sm max-w-xl">{p.enterprise.desc}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
                {p.enterpriseFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:info@peit.ge?subject=Enterprise"
                className="inline-flex items-center gap-2 btn-primary text-white font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap"
              >
                {p.enterprise.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-2 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          {p.payment}
        </p>
      </div>
    </section>
  );
}
