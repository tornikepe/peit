// Loaded automatically by Next.js while /blog (or its dynamic
// children) is fetching. Renders the same Navbar + header text as the
// real page, then 3 BlogCardSkeleton placeholders — gives zero CLS
// when the real cards swap in.

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BlogCardSkeleton } from '@/components/ui/Skeleton';

export default function BlogLoading() {
  return (
    <>
      <Navbar />
      <main className="pt-24 flex-1">
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
                ბლოგი
              </p>
              <h1 className="text-5xl font-bold text-white mb-4">AI ბიზნესისთვის</h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Case studies, სტრატეგიები და სიახლეები.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
