// Thin LLM router: prefer Anthropic Claude (better Georgian + prompt caching),
// fall back to Google Gemini when ANTHROPIC_API_KEY is missing OR Claude
// returns null at runtime (e.g. credit exhausted). Call sites should always
// go through this module instead of importing claude.ts / gemini.ts directly
// so adding a third provider later is a one-file change.
//
// Provider selection is deliberately conservative: we don't try to fail over
// mid-stream — if the chosen provider's stream dies, the SSE endpoint emits
// `done`/`error` and the widget shows its fallback bubble. That keeps the
// happy path predictable and avoids silent quality drops the customer can't
// see.

import {
  isClaudeAvailable,
  generateAnswer as claudeGenerate,
  streamAnswer   as claudeStream,
  type AnswerResultAi,
  type ClaudeUsage,
  type RetrievedChunk,
} from './claude';
import {
  isGeminiAvailable,
  generateAnswer as geminiGenerate,
  streamAnswer   as geminiStream,
} from './gemini';
import type { BotLang, BotTone } from './bots';

export type { AnswerResultAi, ClaudeUsage, RetrievedChunk };

export interface AnswerInput {
  question:     string;
  chunks:       RetrievedChunk[];
  botName:      string;
  industry?:    string;
  tone:         BotTone;
  lang:         BotLang;
  websiteUrl?:  string;
  /** Free-form instructions the business owner wrote for this bot. */
  instructions?: string;
  history?:     { role: 'user' | 'assistant'; content: string }[];
  /** Visitor-attached images (base64) — only Claude consumes these. */
  images?:      { mediaType: string; data: string }[];
  /** Text extracted from attached documents, injected as context. */
  docText?:     string;
}

/** Identifier of the provider that will handle the next request, or null. */
export function pickProvider(): 'anthropic' | 'gemini' | null {
  if (isClaudeAvailable()) return 'anthropic';
  if (isGeminiAvailable()) return 'gemini';
  return null;
}

/** True when at least one LLM provider is usable. */
export function isLLMAvailable(): boolean {
  return pickProvider() !== null;
}

/**
 * Single-shot generation. Routes to the highest-priority provider that's
 * configured; returns null if either no provider is set or the provider
 * fails (caller falls back to keyword tier).
 */
export async function generateAnswer(input: AnswerInput): Promise<AnswerResultAi | null> {
  const provider = pickProvider();
  if (!provider) return null;
  if (provider === 'anthropic') {
    const r = await claudeGenerate(input);
    // If Claude fails AND Gemini is available, try Gemini as a runtime
    // failover — covers the "Anthropic credit ran out" case so the
    // chatbot keeps answering instead of dropping to keyword mode.
    if (!r && isGeminiAvailable()) return geminiGenerate(input);
    return r;
  }
  return geminiGenerate(input);
}

/**
 * Streaming generation. Same provider-selection semantics, but no
 * mid-stream failover — if the chosen provider emits zero deltas, the
 * SSE endpoint above already has its own keyword fallback.
 */
export function streamAnswer(
  input: AnswerInput,
): AsyncGenerator<
  | { type: 'delta'; text: string }
  | { type: 'done';  text: string; usage: ClaudeUsage },
  void,
  unknown
> {
  const provider = pickProvider();
  if (provider === 'anthropic') return claudeStream(input);
  if (provider === 'gemini')    return geminiStream(input);
  return emptyStream();
}

async function* emptyStream(): AsyncGenerator<
  | { type: 'delta'; text: string }
  | { type: 'done';  text: string; usage: ClaudeUsage },
  void,
  unknown
> {
  // No provider configured — caller treats this exactly like a stream
  // that produced no deltas (engine fallback).
}
