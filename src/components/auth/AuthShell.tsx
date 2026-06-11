'use client';

// Shared chrome for the custom /signin and /signup pages — replyory-style:
// dark full-screen canvas with a soft brand glow, centered card, peit wordmark
// on top. The forms inside are fully ours; Clerk only powers the backend.

import Logo from '@/components/Logo';
import type { ReactNode } from 'react';

export default function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow — same family as the dashboard background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 420px at 50% -10%, rgba(59,130,246,0.12), transparent 62%),' +
            'radial-gradient(600px 420px at 90% 110%, rgba(99,102,241,0.07), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a]/90 backdrop-blur-xl shadow-2xl shadow-black/40 p-7 sm:p-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-gray-400 mt-1.5 mb-7 leading-relaxed">{subtitle}</p>
          {children}
        </div>

        <div className="text-center mt-6 text-sm text-gray-400">{footer}</div>
      </div>
    </div>
  );
}

/** Labeled input used by both auth forms. */
export function Field({
  label, children,
}: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-gray-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full bg-white/[0.05] border border-white/[0.09] focus:border-blue-500/60 ' +
  'rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 ' +
  'outline-none transition-colors';
