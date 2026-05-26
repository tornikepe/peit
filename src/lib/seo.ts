// Single source of truth for page `Metadata`. Every page that wants
// proper SEO calls `buildMetadata(...)` to get a complete object with
// canonical, OG, Twitter, robots, and hreflang already wired up.
//
// Why a helper instead of inlining? Two reasons:
//   1. Hreflang is fiddly — every page needs ka/en/ru variants pointing
//      at the right slug. A helper guarantees we never ship a page with
//      a missing language alternate.
//   2. OG image generation is a separate route (/og?title=...&desc=...);
//      defaulting it here means a page that forgets to specify ogImage
//      still gets a branded card.
//
// Base URL convention: we keep using NEXT_PUBLIC_APP_URL (already wired
// across sitemap, robots, email links, unsubscribe HMAC) instead of
// the spec'd NEXT_PUBLIC_SITE_URL so config stays unified. Falls back
// to https://peit.vercel.app in case both are missing.

import type { Metadata } from 'next';

export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://peit.vercel.app')
    .replace(/\/$/, '');

export const DEFAULT_OG_TITLE       = 'Peit — AI ჩატბოტი ქართული ბიზნესისთვის';
export const DEFAULT_OG_DESCRIPTION = 'AI ჩატბოტი, რომელიც პასუხობს კლიენტებს ქართულად 24/7. 10 წუთის setup, 7 დღე უფასოდ.';
export const TWITTER_HANDLE         = '@peitai';

export type SeoLocale = 'ka' | 'en' | 'ru';
export type SeoType   = 'website' | 'article';

export interface SeoProps {
  title:        string;
  description:  string;
  /** Path relative to SITE_URL — must start with "/", no trailing slash. */
  path:         string;
  locale?:      SeoLocale;
  type?:        SeoType;
  /** Absolute URL OR a path relative to SITE_URL. Defaults to /og?... */
  ogImage?:     string;
  /** When true, emits robots: noindex,nofollow. Use for sign-in / preview. */
  noIndex?:     boolean;
  keywords?:    string[];
  /** Optional ISO timestamps for Article-type metadata. */
  publishedAt?: string;
  modifiedAt?:  string;
}

/** Canonical URL builder — handles trailing slashes + missing leading "/". */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Build the auto-generated OG image URL for a page. */
function defaultOgImage(title: string, description: string, type: SeoType): string {
  const qs = new URLSearchParams({ title, description, type });
  return `${SITE_URL}/og?${qs.toString()}`;
}

/**
 * Build a Next.js Metadata object that covers:
 *   - title + description
 *   - canonical URL
 *   - Open Graph (1200×630)
 *   - Twitter card (summary_large_image)
 *   - alternates.languages (ka/en/ru hreflang)
 *   - robots directives respecting noIndex
 *   - per-article timestamps for type='article'
 *
 * Pages plug this in at the top of the file:
 *
 *   export const metadata = buildMetadata({
 *     title: 'Pricing — Peit',
 *     description: '...',
 *     path: '/pricing',
 *   });
 */
export function buildMetadata(props: SeoProps): Metadata {
  const {
    title, description, path, locale = 'ka', type = 'website',
    ogImage, noIndex = false, keywords, publishedAt, modifiedAt,
  } = props;

  const canonical = absoluteUrl(path);
  const og = ogImage
    ? (ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage))
    : defaultOgImage(title, description, type);

  // Hreflang map. Convention: ka lives at the bare path, en/ru live at
  // /en{path} and /ru{path}. The blog pages have real /en + /ru mirrors;
  // other pages will 404 there until the locale segment rolls out — a
  // missing hreflang target is downgraded by Google (not penalised), so
  // emitting the future-correct URLs here is the right tradeoff.
  const languages: Record<string, string> = {
    ka:        absoluteUrl(path),
    en:        absoluteUrl(`/en${path === '/' ? '' : path}`),
    ru:        absoluteUrl(`/ru${path === '/' ? '' : path}`),
    'x-default': absoluteUrl(path),
  };

  // OG locale uses BCP-47-style codes ("ka_GE", "en_US", "ru_RU") that
  // Facebook's scraper accepts.
  const ogLocaleMap: Record<SeoLocale, string> = {
    ka: 'ka_GE',
    en: 'en_US',
    ru: 'ru_RU',
  };

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords:    keywords ?? undefined,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type:        type === 'article' ? 'article' : 'website',
      url:         canonical,
      title,
      description,
      siteName:    'Peit',
      locale:      ogLocaleMap[locale],
      alternateLocale: (['ka_GE','en_US','ru_RU'] as const).filter(l => l !== ogLocaleMap[locale]),
      images: [
        { url: og, width: 1200, height: 630, alt: title },
      ],
      ...(type === 'article' && publishedAt ? { publishedTime: publishedAt } : {}),
      ...(type === 'article' && modifiedAt  ? { modifiedTime:  modifiedAt  } : {}),
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [og],
      site:        TWITTER_HANDLE,
      creator:     TWITTER_HANDLE,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true, follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
  };
}
