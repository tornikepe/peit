'use client';

import { useBots } from '@/context/BotsContext';
import { MessageSquare, TrendingUp, Users, BarChart3 } from 'lucide-react';

export default function DashboardStats() {
  const { bots } = useBots();

  const totalMessages = bots.reduce((s, b) => s + b.stats.messages, 0);
  const totalLeads    = bots.reduce((s, b) => s + b.stats.leads, 0);
  const activeBots    = bots.filter(b => b.status === 'active').length;
  const conversion =
    totalMessages > 0 ? Math.round((totalLeads / totalMessages) * 100) + '%' : '—';

  const stats = [
    { label: 'შეტყობინება სულ',  value: totalMessages.toString(), icon: MessageSquare, color: 'text-violet-400',  bg: 'bg-violet-600/10 border-violet-500/20' },
    { label: 'ლიდი სულ',          value: totalLeads.toString(),    icon: TrendingUp,    color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/20' },
    { label: 'აქტიური ბოტი',      value: activeBots.toString(),    icon: Users,         color: 'text-blue-400',    bg: 'bg-blue-600/10 border-blue-500/20' },
    { label: 'კონვერსია',         value: conversion,               icon: BarChart3,     color: 'text-orange-400',  bg: 'bg-orange-600/10 border-orange-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="glass hover-lift rounded-2xl p-5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${s.bg}`}>
            <s.icon className={s.color} style={{ width: 18, height: 18 }} />
          </div>
          <p className="text-2xl font-bold text-white">{s.value}</p>
          <p className="text-gray-500 text-xs mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
