// Anthropic Claude client for grounded answer generation.
// Returns null when ANTHROPIC_API_KEY is not set so callers can fall back.

import type { BotLang, BotTone } from './bots';

const API     = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-3-5-haiku-20241022'; // cheap, fast, good for FAQ-style answers
const VERSION = '2023-06-01';

export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface RetrievedChunk {
  heading: string;
  content: string;
  /** Higher = more relevant (cosine similarity score, 0..1). */
  score?: number;
}

const TONE_DESC: Record<BotTone, string> = {
  professional: 'Professional, formal, trustworthy. Avoid emojis. Use precise language.',
  friendly:     'Warm, helpful, approachable. Sparing use of emojis (1 per reply max).',
  casual:       'Relaxed, conversational, casual. Light emojis welcome.',
};

const LANG_DESC: Record<BotLang, string> = {
  ka: 'Georgian (ქართული) — natural conversational Georgian',
  en: 'English — natural conversational English',
  ru: 'Russian (Русский) — natural conversational Russian',
};

interface AnswerInput {
  question:     string;
  chunks:       RetrievedChunk[];
  botName:      string;
  industry?:    string;
  tone:         BotTone;
  lang:         BotLang;
  websiteUrl?:  string;
  /** Past turns for conversational continuity — newest last. */
  history?:     { role: 'user' | 'assistant'; content: string }[];
}

interface ClaudeResponse {
  content: { type: string; text?: string }[];
  stop_reason?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

/**
 * Build a grounded answer from retrieved chunks using Claude.
 * Returns null when Claude is not configured or the call fails —
 * the caller should fall back to a deterministic strategy.
 */
export async function generateAnswer(input: AnswerInput): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const contextBlocks = input.chunks
    .map((c, i) => `### [${i + 1}] ${c.heading}\n${c.content.slice(0, 1500)}`)
    .join('\n\n');

  const system = [
    `You are an AI assistant for "${input.botName}"${input.industry ? ` (${input.industry})` : ''}.`,
    `Tone: ${TONE_DESC[input.tone]}`,
    `Language: reply in ${LANG_DESC[input.lang]}.`,
    '',
    'INSTRUCTIONS:',
    '- Answer ONLY using the CONTEXT below. Do not invent facts.',
    '- If the answer is not in the context, politely say so and suggest contacting the team.',
    '- Keep answers concise: 2–4 sentences unless the user asks for detail.',
    '- Use markdown sparingly (**bold**, bullet lists, links). No code blocks.',
    '- Do not mention "context", "knowledge base", or "I was given documents".',
    input.websiteUrl ? `- For more info, you may direct users to ${input.websiteUrl}.` : '',
    '',
    contextBlocks ? 'CONTEXT:\n' + contextBlocks : 'CONTEXT: (no information found)',
  ].filter(Boolean).join('\n');

  const messages = [
    ...(input.history ?? []).slice(-6),
    { role: 'user', content: input.question } as const,
  ];

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': VERSION,
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:       MODEL,
        max_tokens:  600,
        temperature: 0.4,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      console.error('[claude] error:', res.status, (await res.text()).slice(0, 500));
      return null;
    }

    const data = (await res.json()) as ClaudeResponse;
    const text = data.content?.find(c => c.type === 'text')?.text?.trim();
    return text || null;
  } catch (e) {
    console.error('[claude] failed:', e);
    return null;
  }
}
