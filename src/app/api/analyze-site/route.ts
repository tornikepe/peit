import { NextResponse } from 'next/server';
import {
  analyzeSite,
  buildKnowledgeChunks,
  generateFaqsFromAnalysis,
  aiEnhanceFaqs,
} from '@/lib/scraper';
import type { BotLang } from '@/lib/bots';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface AnalyzeRequest {
  url: string;
  lang?: BotLang;
}

export async function POST(req: Request) {
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
