// Schema.org JSON-LD renderer.
//
// Drops a `<script type="application/ld+json">` into the page with the
// payload serialised. The actual SDO objects (Organization, FAQPage,
// SoftwareApplication, Article) are built by the helpers below — pages
// pass concrete data, the helpers handle the boilerplate.
//
// Why this lives in a single component rather than per-page inline:
// every page wants Organization on it (already added to layout.tsx) and
// a few want page-specific schemas (FAQPage on /, Article on blog
// posts, SoftwareApplication on / + /pricing). Centralising means one
// schema bug = one fix.

import type { SeoLocale } from '@/lib/seo';
import { SITE_URL } from '@/lib/seo';

interface JsonLdProps {
  /** A single SDO node OR an array of them (Google accepts either). */
  data: object | object[];
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Server-rendered string — no XSS surface since SDO objects are
      // built from typed helpers, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Schema builders ──────────────────────────────────────────────────────

export function organizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    '@id':      `${SITE_URL}/#organization`,
    name:       'Peit',
    url:        SITE_URL,
    logo:       `${SITE_URL}/favicon.ico`,
    email:      'info@peit.ge',
    sameAs: [
      'https://github.com/tornikepe/peit',
    ],
    address: {
      '@type':           'PostalAddress',
      addressCountry:    'GE',
      addressLocality:   'Tbilisi',
    },
    areaServed: { '@type': 'Country', name: 'Georgia' },
  };
}

export function softwareApplicationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'SoftwareApplication',
    '@id':      `${SITE_URL}/#software`,
    name:       'Peit',
    applicationCategory: 'BusinessApplication',
    operatingSystem:     'Web',
    url:                 SITE_URL,
    description:
      'AI chatbot SaaS for Georgian businesses. Multi-channel (web, Telegram, Instagram, Messenger), Georgian/English/Russian, lead capture, RAG knowledge base.',
    offers: [
      { '@type': 'Offer', name: 'Basic',    price: '45',  priceCurrency: 'GEL', priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M', billingIncrement: 1 } },
      { '@type': 'Offer', name: 'Pro',      price: '65',  priceCurrency: 'GEL', priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M', billingIncrement: 1 } },
      { '@type': 'Offer', name: 'Ultimate', price: '155', priceCurrency: 'GEL', priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M', billingIncrement: 1 } },
    ],
    aggregateRating: {
      '@type':     'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '320',
      bestRating:  '5',
      worstRating: '1',
    },
  };
}

export interface FaqEntry { q: string; a: string }

export function faqPageSchema(items: FaqEntry[]): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: items.map(it => ({
      '@type': 'Question',
      name:    it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    it.a,
      },
    })),
  };
}

export interface ArticleSchemaProps {
  url:           string;
  headline:      string;
  description:   string;
  image:         string;
  datePublished: string;
  dateModified?: string;
  authorName?:   string;
  locale?:       SeoLocale;
}

export function articleSchema(p: ArticleSchemaProps): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': p.url },
    headline:    p.headline,
    description: p.description,
    image:       p.image,
    datePublished: p.datePublished,
    dateModified:  p.dateModified ?? p.datePublished,
    inLanguage:    p.locale ?? 'ka',
    author: {
      '@type': 'Organization',
      name:    p.authorName ?? 'Peit',
      url:     SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id':   `${SITE_URL}/#organization`,
      name:    'Peit',
      logo:    { '@type': 'ImageObject', url: `${SITE_URL}/favicon.ico` },
    },
  };
}
