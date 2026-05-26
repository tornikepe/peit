// /ru/blog — Russian mirror of the blog index.

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPostsSorted } from '@/lib/blog';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title:       'Блог — AI-чатботы для грузинского бизнеса · Peit',
  description: 'Гайды, кейсы и стратегия для AI-чатботов, бизнес-автоматизации и lead generation в Грузии.',
  path:        '/ru/blog',
  locale:      'ru',
});

const CATEGORY_LABEL: Record<string, string> = {
  guide:        'Гид',
  'how-to':     'How-to',
  'case-study': 'Case Study',
  strategy:     'Стратегия',
  comparison:   'Сравнение',
};

export default function BlogRuPage() {
  const posts = getPostsSorted();

  return (
    <>
      <Navbar />
      <main className="pt-24 flex-1">
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Блог</p>
              <h1 className="text-5xl font-bold text-white mb-4">AI для бизнеса</h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Кейсы, стратегии и новости автоматизации грузинского бизнеса.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map(post => {
                const t = post.translations.ru;
                return (
                  <Link
                    key={post.slug}
                    href={`/ru/blog/${post.slug}`}
                    className="glass hover-lift rounded-2xl overflow-hidden flex flex-col group"
                  >
                    <div className="h-44 bg-gradient-to-br from-violet-900/30 to-purple-900/20 flex items-center justify-center">
                      <span className="text-5xl">{post.icon}</span>
                    </div>
                    <div className="p-6 flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                          {CATEGORY_LABEL[post.category] ?? post.category}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h2 className="font-semibold text-white text-[17px] leading-snug group-hover:text-violet-200 transition-colors flex-1">
                        {t.title}
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{t.excerpt}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span className="text-xs text-gray-600">
                          {new Date(post.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-violet-400 group-hover:text-violet-300 flex items-center gap-1">
                          Читать
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
