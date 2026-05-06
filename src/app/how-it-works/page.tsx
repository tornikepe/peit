import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "როგორ მუშაობს — Peit",
  description: "3 ნაბიჯი — 10 წუთი. ატვირთე, გაასხური, შეაგროვე შედეგები.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 flex-1">
        <div className="py-10 px-4 sm:px-6 text-center">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
            პროცესი
          </p>
          <h1 className="text-5xl font-bold text-white mb-4">
            3 ნაბიჯი — 10 წუთი
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            კოდის ცოდნა არ სჭირდება. Setup-ი უფრო სწრაფია ვიდრე ფიქრობ.
          </p>
        </div>
        <HowItWorks />
        {/* CTA */}
        <div className="py-16 px-4 sm:px-6 text-center border-t border-white/[0.06]">
          <h2 className="text-3xl font-bold text-white mb-4">
            მზად ხარ სცადო?
          </h2>
          <p className="text-gray-400 mb-8">
            7 დღე უფასო. საკრედიტო ბარათი არ სჭირდება გასაშვებად.
          </p>
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl text-lg"
          >
            უფასოდ სცადე
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
