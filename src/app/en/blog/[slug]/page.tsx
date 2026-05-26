// /en/blog/[slug] — English mirror of an individual blog post.

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
  const t = post.translations.en;
  return buildMetadata({
    title:       t.title,
    description: t.excerpt,
    path:        `/en/blog/${slug}`,
    locale:      'en',
    type:        'article',
    publishedAt: post.publishedAt,
    keywords:    ['AI chatbot', 'Peit', t.title.split('—')[0].trim()],
  });
}

export default async function BlogPostEnPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <BlogPostView post={post} lang="en" />;
}
