import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import JsonLd, { softwareApplicationSchema } from "@/components/JsonLd";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title:       'ფასები — Peit AI ჩატბოტი · Basic ₾45 / Pro ₾65 / Ultimate ₾155',
  description: '7-დღიანი უფასო ტრიალი. გაუქმება ნებისმიერ დროს. Basic ₾45/თვე, Pro ₾65/თვე, Ultimate ₾155/თვე. ბარათი არ გჭირდება.',
  path:        '/pricing',
  locale:      'ka',
  keywords:    ['AI ჩატბოტი ფასი', 'Peit pricing', 'ჩატბოტი ღირებულება'],
});

export default function PricingPage() {
  return (
    <>
      {/* SoftwareApplication + AggregateRating schema lets Google show
          the price + 4.9★ rating right next to the search result. */}
      <JsonLd data={softwareApplicationSchema()} />
      <Navbar />
      <main className="pt-24 flex-1">
        <div className="py-10 px-4 sm:px-6 text-center">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">ფასები</p>
          <h1 className="text-5xl font-bold text-white mb-4">გამჭვირვალე ფასები</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            7-დღიანი უფასო ტრიალი ყველა პლანზე. გაუქმება ნებისმიერ დროს — ერთი კლიკით.
          </p>
        </div>
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
