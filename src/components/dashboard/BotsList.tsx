'use client';

import Link from 'next/link';
import { useBots } from '@/context/BotsContext';
import { INDUSTRIES } from '@/lib/bots';
import {
  Plus, Bot as BotIcon, MessageSquare, TrendingUp,
  Play, Pause, MoreVertical, ArrowRight,
} from 'lucide-react';

export default function BotsList() {
  const { bots, loaded } = useBots();

  if (!loaded) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Empty state
  if (bots.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 sm:p-14 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
          <BotIcon className="w-7 h-7 text-violet-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">პირველი ბოტი ჯერ არ გაქვს</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          შექმენი AI ასისტენტი, რომელიც 24/7 ემსახურება შენს კლიენტებს.
          Setup სულ 4 ნაბიჯში — კოდი არ სჭირდება.
        </p>
        <Link
          href="/dashboard/bots/new"
          className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          ბოტის შექმნა
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">შენი ბოტები</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {bots.length} ბოტი · {bots.filter(b => b.status === 'active').length} აქტიური
          </p>
        </div>
        <Link
          href="/dashboard/bots/new"
          className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          ახალი ბოტი
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bots.map(bot => {
          const industry = INDUSTRIES.find(i => i.slug === bot.industry);
          return (
            <Link
              key={bot.id}
              href={`/dashboard/bots/${bot.id}`}
              className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-violet-500/30 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${bot.brandColor}, ${bot.brandColor}aa)` }}
                  >
                    <BotIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{bot.name}</p>
                    <p className="text-gray-500 text-xs truncate">{industry?.label}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                {bot.status === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <Play className="w-3 h-3" /> აქტიური
                  </span>
                ) : bot.status === 'paused' ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <Pause className="w-3 h-3" /> შეჩერებული
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-medium bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Draft
                  </span>
                )}
                <span className="text-gray-600 text-xs">
                  {bot.languages.length} ენა · {bot.faqs.length} FAQ
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <div>
                    <p className="text-white text-sm font-semibold">{bot.stats.messages}</p>
                    <p className="text-gray-600 text-[10px]">შეტყობინება</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <p className="text-white text-sm font-semibold">{bot.stats.leads}</p>
                    <p className="text-gray-600 text-[10px]">ლიდი</p>
                  </div>
                </div>
              </div>

              {/* Hover arrow */}
              <div className="mt-4 flex items-center gap-1.5 text-violet-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                გახსნა <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
