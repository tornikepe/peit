// Multi-tier answer engine. Tries each strategy in order and returns the
// first one that produces a quality reply.
//
//   1. FAQ exact / near-exact keyword match — instant, no AI.
//   2. RAG: Voyage embed query → pgvector top-K chunks → Claude generates.
//   3. Keyword search over raw chunks — current "good enough" fallback.
//   4. Static fallback message.
//
// Each step degrades gracefully when its dependencies (API keys, embeddings)
// are missing.

import {
  matchFaq, searchKnowledge,
  DEFAULT_FALLBACKS,
  type Bot, type BotLang,
} from './bots';
import { embedOne, isEmbeddingsAvailable } from './embeddings';
import { generateAnswer, isClaudeAvailable, type RetrievedChunk, type ClaudeUsage } from './claude';
import {
  searchChunksByVector, type RetrievedChunk as DbChunk,
} from '@/db/queries/chunks';

export type AnswerSource = 'faq' | 'knowledge' | 'ai' | 'fallback';

export interface AnswerResult {
  text: string;
  source: AnswerSource;
  /** When source is 'ai', the chunk IDs used as grounding. */
  groundedChunkIds?: string[];
  /** Top retrieval scores for debugging/analytics. */
  retrievalScores?: number[];
  /** Token usage when source is 'ai'. */
  usage?: ClaudeUsage;
}

interface EngineInput {
  query: string;
  bot:   Bot;
  lang:  BotLang;
  /** Optional — past turns for follow-up questions. */
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export async function answer(input: EngineInput): Promise<AnswerResult> {
  const { query, bot, lang, history } = input;

  // ── Tier 1: FAQ exact / near-exact ──────────────────────────────────────
  const faqAnswer = matchFaq(query, bot);
  if (faqAnswer) {
    return { text: faqAnswer, source: 'faq' };
  }

  // ── Tier 2: RAG (Voyage + Claude) ───────────────────────────────────────
  if (isClaudeAvailable()) {
    let chunks: RetrievedChunk[] = [];
    let groundedChunkIds: string[] = [];
    let retrievalScores: number[] = [];

    if (isEmbeddingsAvailable()) {
      try {
        const queryEmb = await embedOne(query, 'query');
        if (queryEmb) {
          const dbChunks: DbChunk[] = await searchChunksByVector(
            bot.id, queryEmb, 5, 0.25,
          );
          if (dbChunks.length > 0) {
            chunks = dbChunks.map(c => ({
              heading: c.heading, content: c.content, score: c.score,
            }));
            groundedChunkIds = dbChunks.map(c => c.id);
            retrievalScores = dbChunks.map(c => c.score);
          }
        }
      } catch (e) {
        console.error('[engine] vector retrieval failed:', e);
      }
    }

    // Fallback retrieval if vector search produced nothing —
    // give Claude the FAQs + first few chunks anyway.
    if (chunks.length === 0) {
      chunks = [
        ...bot.faqs.slice(0, 6).map(f => ({
          heading: f.q,
          content: f.a,
        })),
        ...bot.knowledgeChunks.slice(0, 4).map(c => ({
          heading: c.heading,
          content: c.content,
        })),
      ];
    }

    const ai = await generateAnswer({
      question:   query,
      chunks,
      botName:    bot.name,
      industry:   bot.industry,
      tone:       bot.tone,
      lang,
      websiteUrl: bot.websiteUrl,
      history,
    });

    if (ai) {
      return {
        text: ai.text,
        source: 'ai',
        groundedChunkIds,
        retrievalScores,
        usage: ai.usage,
      };
    }
  }

  // ── Tier 3: Keyword search over chunks ──────────────────────────────────
  const knowledgeAnswer = searchKnowledge(query, bot);
  if (knowledgeAnswer) {
    return { text: knowledgeAnswer, source: 'knowledge' };
  }

  // ── Tier 4: Fallback ────────────────────────────────────────────────────
  const fallback =
    bot.fallback[lang] ??
    bot.fallback[bot.primaryLang] ??
    DEFAULT_FALLBACKS[lang];

  return { text: fallback, source: 'fallback' };
}
