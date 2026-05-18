// Dynamic robots.txt — Next.js auto-serves this at /robots.txt.
//
// Replaces the previous static public/robots.txt so the sitemap URL stays
// in sync with NEXT_PUBLIC_APP_URL across environments (dev, preview, prod).
// AI search bots are explicitly allowed so Peit can be cited in answers
// from ChatGPT, Claude, Perplexity, and Google AI Overviews.

import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://peit.ge';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule — all bots, almost everything indexable, private
      // surface area blocked.
      {
        userAgent: '*',
        allow:     '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/signin',
          '/signup',
          '/widget/',         // iframe target for the embed widget
        ],
      },

      // AI search bots — explicitly welcomed.
      { userAgent: 'GPTBot',         allow: '/' }, // OpenAI ChatGPT
      { userAgent: 'ChatGPT-User',   allow: '/' },
      { userAgent: 'PerplexityBot',  allow: '/' },
      { userAgent: 'ClaudeBot',      allow: '/' }, // Anthropic
      { userAgent: 'anthropic-ai',   allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' }, // Google Gemini / AI Overviews
      { userAgent: 'Bingbot',        allow: '/' }, // Microsoft Copilot

      // Block training-only crawlers (Common Crawl is used by many LLM
      // training pipelines but doesn't drive search visibility for us).
      { userAgent: 'CCBot', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
