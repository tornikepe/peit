'use client';

import { Star, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";

// Exact text from replyory.com (Georgian) — attributed to Peit users
const testimonials = [
  {
    quote: "ღამით ლიდებს ვკარგავდით. დილით ვიღვიძებდი 50 წაუკითხავ ჩატთან, ნახევარი უკვე გაცივებული. ახლა პასუხობენ წამში, საიტზე შემოსვლისთანავე. გასულ თვეში 12 გარიგება დავხურეთ ისეთი საუბრებიდან, რომლებიც ადრე უბრალოდ მკვდრდებოდა.",
    name: "Sarah Mitchell",
    role: "გაყიდვების ხელმძღვანელი, ელ-კომერცია",
    initials: "SM",
    color: "from-violet-600 to-purple-700",
    rating: 5,
    metric: "+12 გარიგება/თვე",
  },
  {
    quote: "ჩატბოტებზე ხელი ჩამოვიქნიე ორი წარუმატებელი ცდის შემდეგ. Peit პირველი იყო, ვიზე ბოდიში არ მომიწია. გუნდმა პირველი კვირის შემდეგ ლოგებში ჩახედა და ვერ გაარჩიეს, რომელი პასუხი იყო ბოტის. ტიკეტები 73 პროცენტით ჩამოვიდა.",
    name: "David Chen",
    role: "CTO, SaaS კომპანია",
    initials: "DC",
    color: "from-blue-600 to-violet-700",
    rating: 5,
    metric: "-73% ტიკეტები",
  },
  {
    quote: "სამშაბათ დილით ჩავრთე, ყავამდეც ვერ მოვასწარი. პარასკევისთვის უკვე 800 კითხვაზე ჰქონდა ნაპასუხები, სანამ შვილის სასკოლო კონცერტზე ვიყავი. გულახდილად, დამავიწყდა რომ მუშაობდა.",
    name: "Marco Rossi",
    role: "ონლაინ მაღაზიის მფლობელი",
    initials: "MR",
    color: "from-emerald-600 to-teal-700",
    rating: 5,
    metric: "800+ პასუხი/კვირა",
  },
  {
    quote: "მომხმარებლები ერთიდაიგივე ხუთ კითხვას სვამენ თავიდან თავამდე. ღამის 11-ზე ტელეფონიდან ვპასუხობდი, ვითომ რაღაც დიდი საქმე იყო. ეს ბოტი წაიკითხავს ჩვენს პროდუქტის გვერდებს და უკეთ პასუხობს, ვიდრე მე. საღამოები დამიბრუნდა.",
    name: "Aisha Karim",
    role: "დამფუძნებელი, სილამაზის ბრენდი",
    initials: "AK",
    color: "from-rose-600 to-pink-700",
    rating: 5,
    metric: "-80% ღამის პასუხები",
  },
  {
    quote: "ჩვენი კლიენტები ოპერაციული გუნდები არიან, ფუჭ ლაპარაკს ვერ იტანენ. მეშინოდა ბოტი გაყიდვებზე ცენტრირებულად ჟღერდა. 20 წუთი დავხარჯეთ ტონის გასწორებაზე და ახლა ჩვენი უმცროსი გაყიდვების მენეჯერივით ლაპარაკობს კარგი დღის დროს. გასულ კვარტალში 38 შეხვედრა დაჯავშნა.",
    name: "Liam Walsh",
    role: "თანადამფუძნებელი, B2B სააგენტო",
    initials: "LW",
    color: "from-amber-600 to-orange-700",
    rating: 5,
    metric: "+38 შეხვედრა/კვარტალი",
  },
  {
    quote: "ინტეგრაცია ის ნაწილი იყო, რისიც მეშინოდა. ჩვენს დახმარების დოკუმენტაციას 90 წამში მიერთდა. ბოტმა ისეთი დაბრუნების კითხვა იპოვა, რომელზეც ორი თვე არასწორად ვპასუხობდი, რადგან ნამდვილი წესი ამოიღო. უხერხული, მაგრამ სასარგებლო.",
    name: "Priya Shah",
    role: "CX ხელმძღვანელი, ფინტექი",
    initials: "PS",
    color: "from-cyan-600 to-blue-700",
    rating: 5,
    metric: "+65% CSAT",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { t } = useLanguage();
  const [active,  setActive]  = useState(0);
  const [paused,  setPaused]  = useState(false);

  const next = useCallback(() => setActive(a => (a + 1) % testimonials.length), []);
  const prev = useCallback(() => setActive(a => (a - 1 + testimonials.length) % testimonials.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next]);

  const indices = [
    active,
    (active + 1) % testimonials.length,
    (active + 2) % testimonials.length,
  ];

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">
            {t.testimonials.label}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            {t.testimonials.title}
          </h2>
          <p className="text-gray-400 text-lg">{t.testimonials.sub}</p>
        </div>

        {/* Join count */}
        <p className="text-center text-gray-500 text-sm mb-12">{t.testimonials.join}</p>

        {/* Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {indices.map((idx, pos) => {
            const tm = testimonials[idx];
            return (
              <div
                key={`${idx}-${pos}`}
                className={`glass rounded-2xl p-7 flex flex-col gap-5 transition-all duration-500 ${
                  pos === 0 ? 'border-violet-500/20' : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <Stars count={tm.rating} />
                  <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                    {tm.metric}
                  </span>
                </div>

                <p className="text-gray-300 leading-relaxed text-[15px] flex-1">
                  &ldquo;{tm.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tm.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {tm.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{tm.name}</p>
                      <BadgeCheck className="w-4 h-4 text-violet-400 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 truncate">{tm.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => { prev(); setPaused(true); }}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => { setActive(i); setPaused(true); }}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-violet-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          <button onClick={() => { next(); setPaused(true); }}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
