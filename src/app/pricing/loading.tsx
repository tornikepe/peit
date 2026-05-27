// /pricing route-level loading state. Middle card uses the highlight
// variant so the skeleton matches the real "popular" plan visually.

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PricingCardSkeleton } from '@/components/ui/Skeleton';

export default function PricingLoading() {
  return (
    <>
      <Navbar />
      <main className="pt-24 flex-1">
        <div className="py-10 px-4 sm:px-6 text-center">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">ფასები</p>
          <h1 className="text-5xl font-bold text-white mb-4">გამჭვირვალე ფასები</h1>
        </div>
        <section className="relative py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCardSkeleton />
            <PricingCardSkeleton highlight />
            <PricingCardSkeleton />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
