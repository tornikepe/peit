"use client";

import { useState } from "react";
import { X, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popup */}
      {open && (
        <div className="glass rounded-2xl w-72 shadow-2xl shadow-violet-900/30 border border-white/10 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-violet-600/20 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Peit AI Agent
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-gray-400">ახლა ონლაინ</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            <div className="bg-white/[0.06] rounded-xl rounded-tl-sm px-4 py-3 mb-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                გამარჯობა! 👋 მსიამოვნებს Peit-ს შესახებ გიპასუხო. შეგიძლია
                სცადო 7 დღე სრულიად უფასოდ.
              </p>
            </div>

            <Link
              href="/signup"
              className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            >
              უფასოდ სცადე
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-xs text-gray-600 mt-2">
              საკრედიტო ბარათი არ სჭირდება
            </p>
          </div>
        </div>
      )}

      {/* Bot button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-105 transition-all"
        aria-label="გახსენი ჩატი"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" strokeWidth={2} />
        )}
        {/* Green online dot */}
        {!open && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#07070f]" />
        )}
      </button>
    </div>
  );
}
