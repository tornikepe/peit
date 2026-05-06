import Link from "next/link";
import {
  UtensilsCrossed,
  ShoppingBag,
  Hotel,
  Home,
  Stethoscope,
  Dumbbell,
  Scissors,
  Scale,
  ArrowRight,
} from "lucide-react";

export const industries = [
  {
    slug: "restaurants",
    icon: UtensilsCrossed,
    label: "რესტორნები",
    description: "მენიუ, ჯავშანი, მიტანა — ავტომატური პასუხები 24/7",
    metric: "+18 ჯავშანი/კვირა",
  },
  {
    slug: "ecommerce",
    icon: ShoppingBag,
    label: "E-Commerce",
    description: "პროდუქტის ინფო, მარაგი, თვალყური — instant-ად",
    metric: "3x კონვერსია",
  },
  {
    slug: "hotels",
    icon: Hotel,
    label: "სასტუმროები",
    description: "ნომრის ჯავშანი, ფასები, amenities — ქართულ-ინგლისური",
    metric: "+25% booking",
  },
  {
    slug: "real-estate",
    icon: Home,
    label: "უძრავი ქონება",
    description: "ობიექტების ინფო, ნახვის ჩანიშვნა, კვალიფიკაცია",
    metric: "+15 ლიდი/კვირა",
  },
  {
    slug: "clinics",
    icon: Stethoscope,
    label: "კლინიკები",
    description: "ჩაწერა, სერვისები, ფასები — HIPAA-compliant",
    metric: "-60% ზარი",
  },
  {
    slug: "gyms",
    icon: Dumbbell,
    label: "სპორტ-დარბაზები",
    description: "გრაფიკი, წევრობა, ტრიალი — ავტო-რეგისტრაცია",
    metric: "+40% წევრი",
  },
  {
    slug: "salons",
    icon: Scissors,
    label: "სილამაზის სალონები",
    description: "ჩაწერა, სერვისები, ფასები — round-the-clock",
    metric: "0 გაცდენილი ჩაწერა",
  },
  {
    slug: "law-firms",
    icon: Scale,
    label: "საიურიდიო ფირმები",
    description: "პირველი კონსულტაცია, პრაქტიკის სფეროები, ღირებულება",
    metric: "+8 კლიენტი/თვე",
  },
];

export default function Industries() {
  return (
    <section
      id="industries"
      className="py-24 px-4 sm:px-6 border-t border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
            ინდუსტრიები
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            ყველა სექტორისთვის
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Peit ადაპტირდება შენი ბიზნესის სპეციფიკასთან — ერთ კვირაში.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {industries.map(({ slug, icon: Icon, label, description, metric }) => (
            <Link
              key={slug}
              href={`/industries/${slug}`}
              className="glass rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-violet-200 transition-colors">
                  {label}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
              <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full self-start">
                {metric}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
