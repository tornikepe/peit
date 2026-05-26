// Shared blog-post layout used by /blog/[slug], /en/blog/[slug], and
// /ru/blog/[slug]. Renders Markdown body via the existing md-mini
// helper so we don't pull in a heavier MDX runtime, plus an Article
// JSON-LD block so each post is rich-result-eligible.

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { renderMd } from '@/lib/md-mini';
import JsonLd, { articleSchema } from '@/components/JsonLd';
import type { BlogPost, BlogLang } from '@/lib/blog';
import { absoluteUrl } from '@/lib/seo';

interface Props { post: BlogPost; lang: BlogLang }

const CATEGORY_LABEL: Record<BlogLang, Record<string, string>> = {
  ka: { guide: 'გზამკვლევი',     'how-to': 'How-to', 'case-study': 'Case Study', strategy: 'სტრატეგია', comparison: 'შედარება' },
  en: { guide: 'Guide',           'how-to': 'How-to', 'case-study': 'Case Study', strategy: 'Strategy',  comparison: 'Comparison' },
  ru: { guide: 'Гид',             'how-to': 'How-to', 'case-study': 'Case Study', strategy: 'Стратегия', comparison: 'Сравнение'  },
};

const BACK_LABEL: Record<BlogLang, string> = {
  ka: '← ბლოგზე დაბრუნება',
  en: '← Back to blog',
  ru: '← Назад в блог',
};

const BLOG_INDEX_PATH: Record<BlogLang, string> = {
  ka: '/blog',
  en: '/en/blog',
  ru: '/ru/blog',
};

export default function BlogPostView({ post, lang }: Props) {
  const t = post.translations[lang];
  const path = lang === 'ka' ? `/blog/${post.slug}` : `/${lang}/blog/${post.slug}`;
  const url  = absoluteUrl(path);

  // renderMd returns a React node tree — safer than dangerouslySet HTML
  // and matches what the rest of the site uses for inline markdown.
  const body = renderMd(t.body);

  return (
    <>
      <JsonLd
        data={articleSchema({
          url,
          headline:      t.title,
          description:   t.excerpt,
          image:         absoluteUrl(`/og?title=${encodeURIComponent(t.title)}&description=${encodeURIComponent(t.excerpt)}&type=article`),
          datePublished: post.publishedAt,
          locale:        lang,
        })}
      />

      <Navbar />
      <main className="pt-24 flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <Link
            href={BLOG_INDEX_PATH[lang]}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-300 mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {BACK_LABEL[lang]}
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
              {CATEGORY_LABEL[lang][post.category] ?? post.category}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
            <span className="text-xs text-gray-600">
              {new Date(post.publishedAt).toLocaleDateString(
                lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US',
                { day: 'numeric', month: 'long', year: 'numeric' },
              )}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-[1.15] mb-6">
            {t.title}
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed mb-10 border-l-2 border-violet-500/40 pl-4">
            {t.excerpt}
          </p>

          {/* prose-blog inherits typography defaults from globals.css */}
          <div className="prose-blog text-gray-200 leading-relaxed">
            {body}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
