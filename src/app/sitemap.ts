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

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,             changeFrequency: 'weekly',  priority: 1.00, lastModified: now },
    { url: `${SITE_URL}/pricing`,      changeFrequency: 'monthly', priority: 0.95, lastModified: now },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.85, lastModified: now },
    { url: `${SITE_URL}/blog`,         changeFrequency: 'weekly',  priority: 0.70, lastModified: now },
  ];

  const industryPages: MetadataRoute.Sitemap = industries.map(i => ({
    url:             `${SITE_URL}/industries/${i.slug}`,
    changeFrequency: 'monthly',
    priority:        0.80,
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
    { url: `${SITE_URL}/terms`,   changeFrequency: 'yearly', priority: 0.30, lastModified: now },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.30, lastModified: now },
    { url: `${SITE_URL}/gdpr`,    changeFrequency: 'yearly', priority: 0.30, lastModified: now },
    { url: `${SITE_URL}/cookies`, changeFrequency: 'yearly', priority: 0.30, lastModified: now },
  ];

  return [...core, ...industryPages, ...alternativePages, ...legal];
}
