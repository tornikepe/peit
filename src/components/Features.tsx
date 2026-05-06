'use client';

import { Zap, Globe, BarChart3, Users, MessageSquare, Clock, Shield, Plug } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const icons = [Clock, MessageSquare, Globe, Users, BarChart3, Plug, Zap, Shield];
const colors = [
  { text: "text-violet-400",  bg: "bg-violet-500/10"  },
  { text: "text-blue-400",    bg: "bg-blue-500/10"    },
  { text: "text-emerald-400", bg: "bg-emerald-500/10" },
  { text: "text-amber-400",   bg: "bg-amber-500/10"   },
  { text: "text-rose-400",    bg: "bg-rose-500/10"    },
  { text: "text-cyan-400",    bg: "bg-cyan-500/10"    },
  { text: "text-purple-400",  bg: "bg-purple-500/10"  },
  { text: "text-teal-400",    bg: "bg-teal-500/10"    },
];

export default function Features() {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">
            {t.features.label}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t.features.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {t.features.sub}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.features.items.map((f, i) => {
            const Icon  = icons[i];
            const color = colors[i];
            return (
              <div
                key={i}
                className="glass rounded-2xl p-6 flex flex-col gap-4 hover:border-violet-500/20 transition-all group"
              >
                <div className={`${color.bg} ${color.text} w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
