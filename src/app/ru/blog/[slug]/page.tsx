// /ru/blog/[slug] — Russian mirror of an individual blog post.

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogPostView from '@/components/BlogPostView';
import { getAllSlugs, getPost } from '@/lib/blog';
import { buildMetadata } from '@/lib/seo';

interface Props { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Not found — Peit' };
  const t = post.translations.ru;
  return buildMetadata({
    title:       t.title,
    description: t.excerpt,
    path:        `/ru/blog/${slug}`,
    locale:      'ru',
    type:        'article',
    publishedAt: post.publishedAt,
    keywords:    ['AI-чатбот', 'Peit', t.title.split('—')[0].trim()],
  });
}

export default async function BlogPostRuPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <BlogPostView post={post} lang="ru" />;
}
