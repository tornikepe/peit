import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ბლოგი — Peit",
  description: "AI ჩატბოტების, ბიზნეს ავტომატიზაციისა და ქართული მარკეტინგის სიახლეები.",
};

const posts = [
  {
    title: "როგორ ქართულმა რესტორანმა AI-ით ჯავშნები 2x გაზარდა",
    excerpt:
      "Café Rustavi-მ Peit-ს AI ასისტენტი 2 კვირაში ჩართო. გასულ თვეში ონლაინ ჯავშნები 2-ჯერ გაიზარდა ღამის ტრაფიკიდან.",
    date: "2026 მაისი",
    readTime: "5 წთ",
    category: "Case Study",
    slug: "restaurant-bookings-2x",
  },
  {
    title: "5 მიზეზი, რატომ კარგავს ბიზნესი ლიდებს ღამე",
    excerpt:
      "გამოკვლევა: ქართული ბიზნესის 73% ვერ ახერხებს ღამის ტრაფიკიდან პასუხს. AI ასისტენტი ამ პრობლემას ხსნის.",
    date: "2026 აპრილი",
    readTime: "4 წთ",
    category: "სტრატეგია",
    slug: "why-businesses-lose-leads-at-night",
  },
  {
    title: "Telegram ბოტი vs ვებსაიტის ჩატი — რომელია უკეთესი?",
    excerpt:
      "ქართული ბაზრისთვის Telegram-ი პირველი სოციალური პლატფორმაა. ვხსნით, სად მუშაობს AI ასისტენტი უკეთ.",
    date: "2026 მარტი",
    readTime: "6 წთ",
    category: "AI",
    slug: "telegram-vs-website-chat",
  },
];

export default function BlogPage() {
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
              <h1 className="text-5xl font-bold text-white mb-4">
                AI ბიზნესისთვის
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Case studies, სტრატეგიები და სიახლეები ქართული ბიზნეს-ავტომატიზაციის შესახებ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article key={post.slug} className="glass rounded-2xl overflow-hidden flex flex-col group">
                  {/* Placeholder image */}
                  <div className="h-44 bg-gradient-to-br from-violet-900/30 to-purple-900/20 flex items-center justify-center">
                    <span className="text-5xl">
                      {post.category === "Case Study" ? "📊" : post.category === "AI" ? "🤖" : "💡"}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="font-semibold text-white text-[17px] leading-snug group-hover:text-violet-200 transition-colors flex-1">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="text-xs text-gray-600">{post.date}</span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                      >
                        წაიკითხე
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
