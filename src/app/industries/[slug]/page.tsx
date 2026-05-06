import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import { industries } from "@/components/Industries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const industryContent: Record<
  string,
  {
    headline: string;
    subheadline: string;
    useCases: string[];
    benefits: string[];
    stat1: { value: string; label: string };
    stat2: { value: string; label: string };
    stat3: { value: string; label: string };
    faqItems: { q: string; a: string }[];
  }
> = {
  restaurants: {
    headline: "AI ასისტენტი რესტორნებისთვის",
    subheadline:
      "Peit პასუხობს მენიუს კითხვებს, ღებულობს ჯავშნებს და მიტანის ორდერებს — 24/7, ქართულად.",
    useCases: [
      "მენიუს ავტომატური პრეზენტაცია",
      "მაგიდის ჯავშნის მართვა",
      "მიტანის ორდერის მიღება",
      "ალერგენების ინფო",
      "სპეც-შეთავაზებების გაგზავნა",
    ],
    benefits: [
      "+18 ჯავშანი კვირაში ღამის ტრაფიკიდან",
      "სამუდამო ღამის პასუხი",
      "0 გაცდენილი ჯავშანი",
      "ქართული + ინგლისური ტურისტებისთვის",
    ],
    stat1: { value: "+18", label: "ჯავშანი/კვირა" },
    stat2: { value: "24/7", label: "ყოველთვის პასუხი" },
    stat3: { value: "0.8წმ", label: "პასუხის სიჩქარე" },
    faqItems: [
      {
        q: "შეუძლია ბოტს ჯავშნის ჩაწერა?",
        a: "კი — Peit ჩაწერს ჯავშანს, გამოგიგზავნის დადასტურებას და შეახსენებს კლიენტს.",
      },
      {
        q: "მიტანის კომპანიებთან ინტეგრაცია?",
        a: "Peit ინტეგრირდება Wolt, Bolt Food-ის API-ებთან. მომავალ გამოშვებაში.",
      },
    ],
  },
  ecommerce: {
    headline: "AI ასისტენტი E-Commerce-სთვის",
    subheadline:
      "პროდუქტის ინფო, მარაგი, ფასი, ტრეკინგი — ყოველი კითხვა ინსტანტურ პასუხს იღებს.",
    useCases: [
      "პროდუქტის ინფო და შედარება",
      "ნაბრძანის სტატუსის ტრეკინგი",
      "მარაგის ლოგისტიკა",
      "დაბრუნება / გაცვლა",
      "Cross-sell და upsell",
    ],
    benefits: [
      "3x მეტი კონვერსია checkout-ზე",
      "-65% support ტიკეტი",
      "24/7 after-hours გაყიდვები",
      "Shopify / WooCommerce ინტეგრაცია",
    ],
    stat1: { value: "3x", label: "კონვერსია" },
    stat2: { value: "-65%", label: "ტიკეტები" },
    stat3: { value: "24/7", label: "გაყიდვები" },
    faqItems: [
      {
        q: "Shopify-ს ინტეგრაცია გვაქვს?",
        a: "კი — Peit სინქრონიზდება შენს პროდუქტის კატალოგთან რეალდროულად.",
      },
      {
        q: "შეუძლია ოპტიმიზაცია checkout კონვერსიაზე?",
        a: "კი — Peit იდენტიფიცირებს cart abandonment-ს და გზავნის პერსონალიზებულ შეთავაზებებს.",
      },
    ],
  },
  hotels: {
    headline: "AI ასისტენტი სასტუმროებისთვის",
    subheadline:
      "ნომრის ჯავშანი, სერვისები, ადგილობრივი რეკომენდაციები — ქართულ-ინგლისური-რუსული.",
    useCases: [
      "ნომრის ხელმისაწვდომობა და ჯავშანი",
      "Check-in/check-out ინფო",
      "Room service შეკვეთა",
      "ადგილობრივი ტურისტული ინფო",
      "Amenities და სერვისები",
    ],
    benefits: [
      "+25% direct booking (OTA-ს გარეშე)",
      "ტურისტებისთვის მრავალენოვანი",
      "24/7 concierge სერვისი",
      "Booking.com-ს ალტერნატიული",
    ],
    stat1: { value: "+25%", label: "პირდაპირი ჯავშანი" },
    stat2: { value: "3", label: "ენა ჩაშენებული" },
    stat3: { value: "24/7", label: "კონსიერჟი" },
    faqItems: [
      {
        q: "შეუძლია ბოტს ჯავშნის ინტეგრაცია?",
        a: "კი — Peit ინტეგრირდება Beds24, Cloudbeds და სხვა PMS სისტემებთან.",
      },
      {
        q: "მრავალენოვანი მხარდაჭერა?",
        a: "ქართული, ინგლისური, რუსული — ყველა ჩაშენებული. სხვა ენები Business პლანზე.",
      },
    ],
  },
  "real-estate": {
    headline: "AI ასისტენტი უძრავი ქონებისთვის",
    subheadline:
      "ობიექტების ინფო, ნახვის ჩანიშვნა, კვალიფიკაცია — ყოველი ლიდი დამუშავებული.",
    useCases: [
      "ობიექტის ინფო და ფოტოები",
      "ნახვის ჩანიშვნა",
      "ბიუჯეტის კვალიფიკაცია",
      "ბანკის სესხის ინფო",
      "სამეზობლოს ინფო",
    ],
    benefits: [
      "+15 კვალიფიცირებული ლიდი/კვირა",
      "0 გაცდენილი მოთხოვნა",
      "ავტო-კვალიფიკაცია budget-ით",
      "CRM ავტო-ჩაწერა",
    ],
    stat1: { value: "+15", label: "ლიდი/კვირა" },
    stat2: { value: "100%", label: "პასუხი" },
    stat3: { value: "2x", label: "გარიგება/თვე" },
    faqItems: [
      {
        q: "შეუძლია CRM-ში ჩაწერა?",
        a: "კი — Bitrix24, amoCRM, HubSpot — ავტომატური სინქრონიზაცია.",
      },
      {
        q: "ობიექტების ბაზა ავტომატურად განახლდება?",
        a: "კი — ატვირთე ობიექტების CSV ან ინტეგრირდი API-ით.",
      },
    ],
  },
  clinics: {
    headline: "AI ასისტენტი კლინიკებისთვის",
    subheadline:
      "ჩაწერა, სერვისები, ფასები — პაციენტი სწრაფ პასუხს იღებს, გუნდი — ნაკლებ ზარს.",
    useCases: [
      "პაციენტის ჩაწერა",
      "სერვისების ინფო",
      "ექიმების განრიგი",
      "ფასების ჩამონათვალი",
      "სადაზღვევო ინფო",
    ],
    benefits: [
      "-60% ტელეფონის ზარი",
      "+35% online ჩაწერა",
      "24/7 ავარიული ინფო",
      "სრულად კონფიდენციალური",
    ],
    stat1: { value: "-60%", label: "ზარები" },
    stat2: { value: "+35%", label: "ჩაწერა" },
    stat3: { value: "24/7", label: "ხელმისაწვდომი" },
    faqItems: [
      {
        q: "პაციენტის მონაცემები დაცულია?",
        a: "კი — Peit არ ინახავს სამედიცინო ინფო. ყველა მონაცემი დაცულია.",
      },
      {
        q: "ჩაწერა ავტომატურად კალენდარში?",
        a: "კი — Google Calendar, Calendly ინტეგრაცია ჩაშენებულია.",
      },
    ],
  },
  gyms: {
    headline: "AI ასისტენტი სპორტ-დარბაზებისთვის",
    subheadline:
      "წევრობა, გრაფიკი, ტრენინგი — Peit რეგისტრირებს ახალ წევრებს 24/7.",
    useCases: [
      "წევრობის ტიპები და ფასები",
      "კლასის გრაფიკი",
      "ტრენერის ჩაწერა",
      "ობიექტები და სერვისები",
      "Free trial რეგისტრაცია",
    ],
    benefits: [
      "+40% ახალი წევრი/თვე",
      "24/7 გრაფიკის ინფო",
      "ავტო-trial რეგისტრაცია",
      "Upsell upgrade-ები",
    ],
    stat1: { value: "+40%", label: "წევრი/თვე" },
    stat2: { value: "0", label: "გაცდენილი trial" },
    stat3: { value: "24/7", label: "ხელმისაწვდომი" },
    faqItems: [
      {
        q: "Mindbody ან Glofox ინტეგრაცია?",
        a: "კი — სპორტ სტუდიების ყველა ძირითად პლატფორმასთან ინტეგრაცია.",
      },
      {
        q: "ბოტი კლასს ავტომატურად ჩაწერს?",
        a: "კი — კლიენტი ირჩევს კლასს, Peit ჩაწერს და გამოუგზავნის reminder-ს.",
      },
    ],
  },
  salons: {
    headline: "AI ასისტენტი სილამაზის სალონებისთვის",
    subheadline:
      "ჩაწერა, სერვისები, ფასები — round-the-clock, გაცდენილი ჩაწერა ნული.",
    useCases: [
      "სტილისტის ჩაწერა",
      "სერვისებისა და ფასების ინფო",
      "ხელმისაწვდომი დრო",
      "Reminder-ები",
      "ახალი კლიენტის შეძენა",
    ],
    benefits: [
      "0 გაცდენილი ჩაწერა",
      "+28% ახალი კლიენტი",
      "24/7 ჩაწერა WhatsApp/Telegram-ზე",
      "ავტო-reminder გაგზავნა",
    ],
    stat1: { value: "0", label: "გაცდენილი ჩაწერა" },
    stat2: { value: "+28%", label: "ახალი კლიენტი" },
    stat3: { value: "24/7", label: "ჩაწერა" },
    faqItems: [
      {
        q: "Fresha ან Vagaro ინტეგრაცია?",
        a: "კი — სალონის მართვის ძირითად სისტემებთან ინტეგრაცია.",
      },
      {
        q: "Reminder-ები ავტომატურია?",
        a: "კი — 24 საათით ადრე SMS/Telegram-ით.",
      },
    ],
  },
  "law-firms": {
    headline: "AI ასისტენტი საიურიდიო ფირმებისთვის",
    subheadline:
      "პირველი კონსულტაცია, პრაქტიკის სფეროები, ღირებულება — კლიენტი ინფორმირებული.",
    useCases: [
      "პრაქტიკის სფეროების ინფო",
      "პირველი კონსულტაციის ჩაწერა",
      "ღირებულების ინდიკაცია",
      "კლიენტის კვალიფიკაცია",
      "დოკუმენტების სია",
    ],
    benefits: [
      "+8 ახალი კლიენტი/თვე",
      "-50% initial intake დრო",
      "24/7 basic კითხვებზე პასუხი",
      "კვალიფიცირებული ლიდები",
    ],
    stat1: { value: "+8", label: "კლიენტი/თვე" },
    stat2: { value: "-50%", label: "intake დრო" },
    stat3: { value: "24/7", label: "პასუხი" },
    faqItems: [
      {
        q: "ბოტი იურიდიულ კონსულტაციას გასცემს?",
        a: "არა — Peit ატარებს basic intake-ს და ჩაწერს კლიენტს. კონსულტაცია ადამიანის პასუხისმგებლობაა.",
      },
      {
        q: "კონფიდენციალობა დაცულია?",
        a: "კი — ყველა მონაცემი დაშიფრულია. GDPR-compliant.",
      },
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return industries.map((ind) => ({ slug: ind.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const ind = industries.find((i) => i.slug === slug);
  if (!ind) return {};
  const content = industryContent[slug];
  return {
    title: `${content?.headline ?? ind.label} — Peit`,
    description: content?.subheadline,
  };
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const ind = industries.find((i) => i.slug === slug);
  const content = industryContent[slug];

  if (!ind || !content) notFound();

  const Icon = ind.icon;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-0 flex-1">
        {/* Hero */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto">
            <Link
              href="/#industries"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              ყველა ინდუსტრია
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Icon className="w-7 h-7 text-violet-400" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              {content.headline}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-10">
              {content.subheadline}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-10">
              {[content.stat1, content.stat2, content.stat3].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl px-6 py-4 text-center">
                  <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
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

        {/* Use cases + Benefits */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">რას კეთებს Peit</h2>
              <ul className="flex flex-col gap-3">
                {content.useCases.map((uc) => (
                  <li key={uc} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-4 h-4 text-violet-400 shrink-0" />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">შედეგები</h2>
              <ul className="flex flex-col gap-3">
                {content.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">კითხვები</h2>
            <div className="flex flex-col gap-4">
              {content.faqItems.map((faq) => (
                <div key={faq.q} className="glass rounded-2xl p-6">
                  <p className="font-semibold text-white mb-2">{faq.q}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
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
