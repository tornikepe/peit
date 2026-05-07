'use client';

import { Cloud, HardDrive } from 'lucide-react';
import { useBots } from '@/context/BotsContext';

export default function StorageModeBadge() {
  const { mode, loaded } = useBots();
  if (!loaded || mode === 'unknown') return null;

  if (mode === 'cloud') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
        <Cloud className="w-3 h-3" />
        ღრუბელი
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full"
      title="DATABASE_URL არ არის დაყენებული — მონაცემები ბრაუზერში ინახება"
    >
      <HardDrive className="w-3 h-3" />
      ლოკალური
    </span>
  );
}
