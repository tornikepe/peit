// Dynamic sitemap — Next.js auto-serves this at /sitemap.xml.
//
// Listed: every public, indexable page on the site. Skipped: /dashboard,
// /signin, /signup, /api, /widget — these are blocked in robots.ts too.
//
// Last-modified dates use the build time so search engines see a fresh
// timestamp on each deploy. Priority is informational — Google ignores
// it, but Bing still reads it.

import type { MetadataRoute } from 'next';
import { industries } from '@/components/Industries';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://peit.vercel.app';

// Alternative-page slugs — keep in sync with the lookup table in
// src/app/alternatives/[slug]/page.tsx.
const ALTERNATIVE_SLUGS = ['tidio', 'drift', 'intercom'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Pricing + how-it-works are now in-page sections on the homepage, and
  // the blog has been removed — so only the homepage itself is listed here.
  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.00, lastModified: now },
  ];

  const industryPages: MetadataRoute.Sitemap = industries.map(i => ({
    url:             `${SITE_URL}/industries/${i.slug}`,
    changeFrequency: 'weekly',
    priority:        0.70,
    lastModified:    now,
  }));

  const alternativePages: MetadataRoute.Sitemap = ALTERNATIVE_SLUGS.map(slug => ({
    url:             `${SITE_URL}/alternatives/${slug}`,
    changeFrequency: 'monthly',
    priority:        0.75,
    lastModified:    now,
  }));

  // Legal pages — lower priority but still indexable; trust signal for SEO.
  const legal: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/terms`,   changeFrequency: 'monthly', priority: 0.30, lastModified: now },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.30, lastModified: now },
    { url: `${SITE_URL}/gdpr`,    changeFrequency: 'monthly', priority: 0.30, lastModified: now },
    { url: `${SITE_URL}/cookies`, changeFrequency: 'monthly', priority: 0.30, lastModified: now },
  ];

  return [...core, ...industryPages, ...alternativePages, ...legal];
}
