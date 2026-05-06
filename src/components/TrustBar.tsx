'use client';

import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const avatars = [
  { initials: "SM", color: "from-violet-600 to-purple-700" },
  { initials: "DC", color: "from-blue-600 to-violet-700" },
  { initials: "MR", color: "from-emerald-600 to-teal-700" },
  { initials: "AK", color: "from-rose-600 to-pink-700" },
  { initials: "LW", color: "from-amber-600 to-orange-700" },
  { initials: "PS", color: "from-cyan-600 to-blue-700" },
];

const scrollingNames = [
  "Online Shop GE", "MarShop", "SaaS სტარტაპი", "Tbilisi Resto", "LegalPro GE",
  "FitClub GE", "GeoHotel", "BeautyStudio", "RealEstate GE", "MediClinic",
  "TechStartup", "FoodDelivery", "EventsPro", "EduAcademy", "AutoService GE",
];

export default function TrustBar() {
  const { t } = useLanguage();
  const ref   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame: number;
    let pos = 0;

    const tick = () => {
      pos += 0.4;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.style.transform = `translateX(-${pos}px)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="py-10 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">

          {/* Avatar cluster + count */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {avatars.map((a, i) => (
                <div
                  key={a.initials}
                  style={{ zIndex: avatars.length - i }}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.color} border-2 border-[#07070f] flex items-center justify-center text-white text-xs font-bold`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{t.trustBar.headline}</p>
              <p className="text-gray-500 text-xs">{t.trustBar.sub}</p>
            </div>
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <span className="text-white font-semibold text-sm">{t.trustBar.rating}</span>
            <span className="text-gray-500 text-xs">{t.trustBar.reviews}</span>
          </div>
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#07070f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#07070f] to-transparent z-10 pointer-events-none" />
          <div ref={ref} className="flex gap-3 whitespace-nowrap will-change-transform">
            {[...scrollingNames, ...scrollingNames].map((name, i) => (
              <span
                key={i}
                className="text-gray-600 text-sm font-medium border border-white/[0.06] rounded-full px-4 py-1.5 bg-white/[0.02] select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
