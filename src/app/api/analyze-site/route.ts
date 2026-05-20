// POST /api/analyze-site — used by the new-bot wizard to scrape a URL and
// generate FAQs / knowledge chunks. AUTH-REQUIRED: it triggers outbound HTTP
// + an Anthropic call (token spend), so an unauthenticated version is a
// trivial way to burn the AI budget and turn us into a free site scraper.
//
// In addition to the Clerk auth check we rate-limit per user (5/h) and per
// IP (3/min) — the wizard never legitimately needs more than that.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  analyzeSite,
  buildKnowledgeChunks,
  generateFaqsFromAnalysis,
  aiEnhanceFaqs,
} from '@/lib/scraper';
import type { BotLang } from '@/lib/bots';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface AnalyzeRequest {
  url: string;
  lang?: BotLang;
}

export async function POST(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // ── Rate limits ───────────────────────────────────────────────────────
  // Per IP: cheap DoS guard. Per user: cost shield against a compromised
  // account or a malicious user creating many bots back-to-back.
  const ip = getClientIp(req);
  const rlIp = await checkRateLimit(rateLimitKey(['analyze_ip', ip]), 3, 60);
  if (!rlIp.allowed) {
    return NextResponse.json({ error: 'RATE_LIMITED', retryInMs: rlIp.resetInMs }, { status: 429 });
  }
  const rlUser = await checkRateLimit(rateLimitKey(['analyze_user', userId]), 5, 3600);
  if (!rlUser.allowed) {
    return NextResponse.json({
      error:     'RATE_LIMITED',
      message:   'Reached hourly limit for site analysis — try again later.',
      retryInMs: rlUser.resetInMs,
    }, { status: 429 });
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, lang = 'ka' } = body;
  if (!url || typeof url !== 'string' || url.length < 4) {
    return NextResponse.json({ error: 'Missing or invalid URL' }, { status: 400 });
  }

  // Reject obvious junk before paying for a scrape.
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return NextResponse.json({ error: 'Only http/https URLs supported' }, { status: 400 });
  }
  // SSRF guard — never let users scrape internal infrastructure.
  if (
    /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(parsed.hostname) ||
    parsed.hostname === '0.0.0.0'
  ) {
    return NextResponse.json({ error: 'Internal hostnames are not allowed' }, { status: 400 });
  }

  try {
    const analysis = await analyzeSite(url);

    // Build knowledge chunks from ALL scraped content
    const chunks = buildKnowledgeChunks(analysis);

    // Generate FAQs: try AI first, fall back to heuristic
    const aiFaqs = await aiEnhanceFaqs(analysis, lang);
    const faqs =
      aiFaqs && aiFaqs.length > 0
        ? aiFaqs
        : generateFaqsFromAnalysis(analysis, lang);

    return NextResponse.json({
      ok: true,
      source: aiFaqs ? 'ai' : 'heuristic',
      analysis: {
        title: analysis.title,
        description: analysis.description,
        detectedIndustry: analysis.detectedIndustry,
        language: analysis.language,
        pagesScraped: analysis.pagesScraped,
        signals: analysis.signals,
        contact: analysis.contact,
        headingsCount: analysis.headings.length,
        paragraphsCount: analysis.paragraphs.length,
        chunksCount: chunks.length,
      },
      faqs,
      chunks, // ← full knowledge base for storage in bot
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
