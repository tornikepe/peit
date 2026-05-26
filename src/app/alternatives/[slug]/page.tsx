import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AlternativeData = {
  name: string;
  headline: string;
  subheadline: string;
  theirPrice: string;
  ourPrice: string;
  theirWeaknesses: string[];
  ourStrengths: string[];
  comparisonRows: { feature: string; them: boolean; us: boolean }[];
};

const alternatives: Record<string, AlternativeData> = {
  tidio: {
    name: "Tidio",
    headline: "Peit — Tidio-ს საუკეთესო ალტერნატივა",
    subheadline:
      "Tidio ბევრ ფუნქციაზე ითხოვს premium-ს. Peit იძლევა ყველაფერს ნახევარ ფასად — ქართულ ენაზე.",
    theirPrice: "$29/თვე+",
    ourPrice: "₾65/თვე",
    theirWeaknesses: [
      "ქართული ენა არ აქვს",
      "Setup-ი რთული და ძვირი",
      "ძირითადი ფუნქციები მხოლოდ higher tier-ზე",
      "საქართველოში technical support არ არის",
    ],
    ourStrengths: [
      "ქართული, ინგლისური, რუსული ჩაშენებული",
      "10 წუთი setup — კოდი არ სჭირდება",
      "ყველა ფუნქცია Pro პლანში",
      "ქართული support ტიმი",
    ],
    comparisonRows: [
      { feature: "ქართული ენა", them: false, us: true },
      { feature: "7-დღიანი უფასო ტრიალი", them: false, us: true },
      { feature: "Telegram ინტეგრაცია", them: true, us: true },
      { feature: "ლოკალური support", them: false, us: true },
      { feature: "ყველა ფუნქცია Pro-ზე", them: false, us: true },
      { feature: "10-წუთი setup", them: false, us: true },
    ],
  },
  drift: {
    name: "Drift",
    headline: "Peit — Drift-ის ქართული ალტერნატივა",
    subheadline:
      "Drift-ი enterprise-სთვისაა და ძვირი. Peit-ს აქვს enterprise დონის AI — SMB ფასად, ქართულ ენაზე.",
    theirPrice: "$2,500/თვე+",
    ourPrice: "₾65/თვე",
    theirWeaknesses: [
      "ფასი $2,500+/თვე — SMB-ისთვის მიუწვდომელი",
      "ქართული ენა არ არის",
      "Annual contract სავალდებულო",
      "ლოკალური support არ არის",
    ],
    ourStrengths: [
      "SMB-ზე ორიენტირებული ფასი",
      "ქართული-ინგლისური-რუსული",
      "Monthly subscription — lock-in არ არის",
      "ადგილობრივი ქართული გუნდი",
    ],
    comparisonRows: [
      { feature: "SMB ფასი", them: false, us: true },
      { feature: "ქართული ენა", them: false, us: true },
      { feature: "Monthly billing", them: false, us: true },
      { feature: "7-დღიანი ტრიალი", them: false, us: true },
      { feature: "ლოკალური support", them: false, us: true },
      { feature: "10-წუთი setup", them: false, us: true },
    ],
  },
  intercom: {
    name: "Intercom",
    headline: "Peit — Intercom-ის ბიუჯეტური ალტერნატივა",
    subheadline:
      "Intercom-ი საშუალო ბიზნესს $300-1000/თვეს ართმევს. Peit — იგივე AI ხარისხი ₾65-ად, ქართულ ენაზე.",
    theirPrice: "$300–1,000/თვე",
    ourPrice: "₾65/თვე",
    theirWeaknesses: [
      "ფასი გამოიყენებულ seat-ებზე მიხედვით იზრდება",
      "ქართული ენა არ არის",
      "Complex onboarding",
      "SMB-ისთვის გადაჭარბებული",
    ],
    ourStrengths: [
      "ფიქსირებული ფასი — surprise-ი არ არის",
      "ქართული-ინგლისური-რუსული",
      "10 წუთი onboarding",
      "SMB-ზე ოპტიმიზებული",
    ],
    comparisonRows: [
      { feature: "ფიქსირებული ფასი", them: false, us: true },
      { feature: "ქართული ენა", them: false, us: true },
      { feature: "10-წუთი setup", them: false, us: true },
      { feature: "7-დღიანი ტრიალი", them: true, us: true },
      { feature: "Telegram ინტეგრაცია", them: false, us: true },
      { feature: "ლოკალური support", them: false, us: true },
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(alternatives).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const alt = alternatives[slug];
  if (!alt) return {};
  const { buildMetadata } = await import('@/lib/seo');
  return buildMetadata({
    title:       `${alt.headline} — Peit`,
    description: alt.subheadline,
    path:        `/alternatives/${slug}`,
    locale:      'ka',
    keywords:    [`Peit vs ${slug}`, `${slug} alternative`, 'AI chatbot Georgia'],
  });
}

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params;
  const alt = alternatives[slug];
  if (!alt) notFound();

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-0 flex-1">
        {/* Hero */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              მთავარი
            </Link>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              {alt.headline}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-10">{alt.subheadline}</p>

            {/* Price comparison */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
              <div className="glass rounded-2xl px-8 py-5 text-center">
                <p className="text-sm text-gray-500 mb-1">{alt.name}</p>
                <p className="text-3xl font-bold text-gray-300 line-through">{alt.theirPrice}</p>
              </div>
              <div className="text-2xl font-bold text-gray-600">vs</div>
              <div className="glass rounded-2xl px-8 py-5 text-center border-violet-500/40">
                <p className="text-sm text-violet-400 mb-1">Peit</p>
                <p className="text-3xl font-bold gradient-text">{alt.ourPrice}</p>
              </div>
            </div>

            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl text-lg"
            >
              7-დღიანი უფასო ტრიალი
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Weaknesses vs Strengths */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">{alt.name}-ის პრობლემები</h2>
              <ul className="flex flex-col gap-3">
                {alt.theirWeaknesses.map((w) => (
                  <li key={w} className="flex items-start gap-3 text-gray-400 text-sm">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-8 border-violet-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Peit-ს უპირატესობები</h2>
              <ul className="flex flex-col gap-3">
                {alt.ourStrengths.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">დეტალური შედარება</h2>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 px-6 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-gray-400">ფუნქცია</p>
                <p className="text-sm font-semibold text-gray-400 text-center">{alt.name}</p>
                <p className="text-sm font-semibold text-violet-400 text-center">Peit</p>
              </div>
              {alt.comparisonRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 px-6 py-4 ${
                    i < alt.comparisonRows.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <p className="text-sm text-gray-300">{row.feature}</p>
                  <div className="flex justify-center">
                    {row.them ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.us ? (
                      <Check className="w-4 h-4 text-violet-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
