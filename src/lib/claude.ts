// Anthropic Claude client for grounded answer generation.
// Uses the official SDK with prompt caching on the system prompt + retrieved
// chunks. Returns null when ANTHROPIC_API_KEY is not set so the answer engine
// can fall back to keyword search.
//
// Model: claude-haiku-4-5 — replacement for the retired claude-3-5-haiku.
// Cheap + fast (1$/5$ per 1M tokens, 200K context), well-suited for a
// customer-support chatbot SaaS at our price tier.

import Anthropic from '@anthropic-ai/sdk';
import type { BotLang, BotTone } from './bots';

const MODEL = 'claude-haiku-4-5';

let cached: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cached) cached = new Anthropic();
  return cached;
}

export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface RetrievedChunk {
  heading: string;
  content: string;
  /** Higher = more relevant (cosine similarity score, 0..1). */
  score?: number;
}

export interface ClaudeUsage {
  inputTokens:  number;
  outputTokens: number;
  cachedTokens: number;
}

export interface AnswerResultAi {
  text:  string;
  usage: ClaudeUsage;
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
  /** Images the visitor attached (Feature #3) — base64, for vision. */
  images?:      { mediaType: string; data: string }[];
  /** Text extracted from attached documents (PDF/DOCX), injected as context. */
  docText?:     string;
}

/**
 * Build the system-prompt blocks. The frozen instructions block is cached
 * (5-min TTL) so repeated requests for the same bot pay ~0.1× input cost.
 * The retrieved-chunks block is volatile and intentionally placed AFTER the
 * cache breakpoint — it changes per question so it'd never cache anyway.
 */
function buildSystem(input: AnswerInput): Anthropic.TextBlockParam[] {
  const frozen =
    `You are an AI assistant for "${input.botName}"${input.industry ? ` (${input.industry})` : ''}.\n` +
    `Tone: ${TONE_DESC[input.tone]}\n` +
    `Language: reply in ${LANG_DESC[input.lang]}.\n\n` +
    `INSTRUCTIONS:\n` +
    `- Answer ONLY using the CONTEXT below. Do not invent facts.\n` +
    `- If the answer is not in the context, politely say so and suggest contacting the team.\n` +
    `- Keep answers concise: 2–4 sentences unless the user asks for detail.\n` +
    `- Use markdown sparingly (**bold**, bullet lists, links). No code blocks.\n` +
    `- Do not mention "context", "knowledge base", or "I was given documents".\n` +
    (input.websiteUrl ? `- For more info, you may direct users to ${input.websiteUrl}.\n` : '');

  const contextBlocks = input.chunks.length
    ? 'CONTEXT:\n' + input.chunks
        .map((c, i) => `### [${i + 1}] ${c.heading}\n${c.content.slice(0, 1500)}`)
        .join('\n\n')
    : 'CONTEXT: (no information found — politely tell the user to contact the team.)';

  // Cache the frozen block; leave the volatile context uncached.
  // Min cacheable prefix on Haiku 4.5 is 4096 tokens — short prompts silently
  // won't cache (no error, just zero `cache_read_input_tokens`).
  return [
    { type: 'text', text: frozen, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: contextBlocks },
  ];
}

function buildMessages(input: AnswerInput): Anthropic.MessageParam[] {
  // Compose the final user turn. When the visitor attached a document we
  // inject its extracted text; when they attached images we add image
  // blocks so Haiku can actually see them (Feature #3).
  const questionText = input.docText
    ? `${input.question}\n\n[Attached document content]\n${input.docText.slice(0, 8000)}`
    : input.question;

  const images = input.images ?? [];
  const userContent: Anthropic.ContentBlockParam[] = [
    { type: 'text', text: questionText || '(see attached image)' },
    ...images.slice(0, 4).map((img): Anthropic.ImageBlockParam => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType as 'image/jpeg', data: img.data },
    })),
  ];

  return [
    ...(input.history ?? []).slice(-6),
    { role: 'user', content: images.length > 0 ? userContent : questionText },
  ];
}

/**
 * Non-streaming answer generation. Returns null on missing key / API failure
 * so the caller can fall back to keyword search.
 */
export async function generateAnswer(input: AnswerInput): Promise<AnswerResultAi | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const res = await client.messages.create({
      model:       MODEL,
      max_tokens:  600,
      system:      buildSystem(input),
      messages:    buildMessages(input),
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    if (!text) return null;

    return {
      text,
      usage: {
        inputTokens:  res.usage.input_tokens ?? 0,
        outputTokens: res.usage.output_tokens ?? 0,
        cachedTokens: res.usage.cache_read_input_tokens ?? 0,
      },
    };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error('[claude]', e.status, e.message);
    } else {
      console.error('[claude] failed:', e);
    }
    return null;
  }
}

/**
 * Streaming variant. Yields text deltas as they arrive, then resolves with
 * the final `usage` once the stream completes. Used by the SSE endpoint to
 * give the widget a typewriter experience.
 */
export async function* streamAnswer(
  input: AnswerInput,
): AsyncGenerator<
  | { type: 'delta'; text: string }
  | { type: 'done';  text: string; usage: ClaudeUsage },
  void,
  unknown
> {
  const client = getClient();
  if (!client) return;

  const stream = client.messages.stream({
    model:       MODEL,
    max_tokens:  600,
    system:      buildSystem(input),
    messages:    buildMessages(input),
  });

  try {
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { type: 'delta', text: event.delta.text };
      }
    }

    const final = await stream.finalMessage();
    const text = final.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    yield {
      type:  'done',
      text,
      usage: {
        inputTokens:  final.usage.input_tokens ?? 0,
        outputTokens: final.usage.output_tokens ?? 0,
        cachedTokens: final.usage.cache_read_input_tokens ?? 0,
      },
    };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error('[claude:stream]', e.status, e.message);
    } else {
      console.error('[claude:stream] failed:', e);
    }
    // Generator just ends — caller treats this as engine failure.
  }
}
