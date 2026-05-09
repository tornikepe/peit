import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ფასები — Peit",
  description: "7-დღიანი უფასო ტრიალი. გაუქმება ნებისმიერ დროს. Starter $19/თვე, Pro $49/თვე, Business $99/თვე.",
};

export default function PricingPage() {
  return (
    <>
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
