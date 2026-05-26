// /blog/[slug] — KA blog post. Static-generated for every slug in
// lib/blog.POSTS at build time so individual post pages serve from
// CDN edge cache (and Google can crawl deterministically).

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
  const t = post.translations.ka;
  return buildMetadata({
    title:       t.title,
    description: t.excerpt,
    path:        `/blog/${slug}`,
    locale:      'ka',
    type:        'article',
    publishedAt: post.publishedAt,
    keywords:    ['AI ჩატბოტი', 'Peit', t.title.split('—')[0].trim()],
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <BlogPostView post={post} lang="ka" />;
}
