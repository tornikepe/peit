// Google Gemini client — drop-in alternative to claude.ts for grounded
// answer generation. Used when GEMINI_API_KEY is set but ANTHROPIC_API_KEY
// isn't (or has run out of credits). Same `generateAnswer` / `streamAnswer`
// surface as claude.ts so the call sites stay symmetric.
//
// Model: gemini-2.5-flash — currently the cheapest Gemini that
// supports `generateContent` on the free tier (15 RPM, 1500 RPD).
// Free tier doesn't expose prompt caching, so this provider lacks
// the `cachedTokens` count Claude reports. We always emit 0.
//
// API: REST (no SDK) — keeps the dependency footprint small and
// avoids pulling in the Google AI SDK which carries protobuf weight.

import type { BotLang, BotTone } from './bots';
import type { RetrievedChunk, ClaudeUsage, AnswerResultAi } from './claude';

const MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string | null {
  const k = process.env.GEMINI_API_KEY?.trim();
  return k && k.length ? k : null;
}

export function isGeminiAvailable(): boolean {
  return !!getApiKey();
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
  history?:     { role: 'user' | 'assistant'; content: string }[];
}

/** Build the system instruction + context block as one big string. */
function buildSystemText(input: AnswerInput): string {
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
    ? '\nCONTEXT:\n' + input.chunks
        .map((c, i) => `### [${i + 1}] ${c.heading}\n${c.content.slice(0, 1500)}`)
        .join('\n\n')
    : '\nCONTEXT: (no information found — politely tell the user to contact the team.)';

  return frozen + contextBlocks;
}

/** Gemini message shape — same as OpenAI-ish but uses `role: model` for assistant. */
interface GeminiContent {
  role:  'user' | 'model';
  parts: { text: string }[];
}

function buildContents(input: AnswerInput): GeminiContent[] {
  const history = (input.history ?? []).slice(-6).map<GeminiContent>(h => ({
    role:  h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));
  return [
    ...history,
    { role: 'user', parts: [{ text: input.question }] },
  ];
}

interface GeminiUsage {
  promptTokenCount?:     number;
  candidatesTokenCount?: number;
  totalTokenCount?:      number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: GeminiUsage;
  error?: { code: number; message: string };
}

/**
 * Non-streaming generation. Returns null on missing key / API failure so the
 * caller can fall back to the keyword tier — identical contract to
 * claude.ts#generateAnswer.
 */
export async function generateAnswer(input: AnswerInput): Promise<AnswerResultAi | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${API_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystemText(input) }] },
          contents:          buildContents(input),
          generationConfig: {
            maxOutputTokens: 600,
            temperature:     0.4,
          },
        }),
      },
    );

    if (!res.ok) {
      console.error('[gemini]', res.status, (await res.text()).slice(0, 300));
      return null;
    }

    const data = await res.json() as GeminiResponse;
    if (data.error) {
      console.error('[gemini] api error:', data.error.code, data.error.message);
      return null;
    }

    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map(p => p.text ?? '')
      .join('')
      .trim();

    if (!text) return null;

    return {
      text,
      usage: usageFromGemini(data.usageMetadata),
    };
  } catch (e) {
    console.error('[gemini] failed:', e);
    return null;
  }
}

/**
 * Streaming variant using SSE. Yields text deltas as they arrive, then
 * resolves with the final usage. Gemini's streaming endpoint is
 * `:streamGenerateContent?alt=sse`.
 */
export async function* streamAnswer(
  input: AnswerInput,
): AsyncGenerator<
  | { type: 'delta'; text: string }
  | { type: 'done';  text: string; usage: ClaudeUsage },
  void,
  unknown
> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  let res: Response;
  try {
    res = await fetch(
      `${API_BASE}/models/${MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystemText(input) }] },
          contents:          buildContents(input),
          generationConfig: {
            maxOutputTokens: 600,
            temperature:     0.4,
          },
        }),
      },
    );
  } catch (e) {
    console.error('[gemini:stream] fetch failed:', e);
    return;
  }

  if (!res.ok || !res.body) {
    console.error('[gemini:stream]', res.status, (await res.text().catch(() => '')).slice(0, 300));
    return;
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';
  let fullText  = '';
  let lastUsage: GeminiUsage | undefined;

  try {
    // Gemini SSE format: lines of `data: {...json...}\n\n`. Newlines may
    // split mid-chunk — buffer until we see a complete `data:` line.
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process complete events (terminated by `\n\n`)
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const evt = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const line = evt.split('\n').find(l => l.startsWith('data:'));
        if (!line) continue;
        const json = line.slice(5).trim();
        if (!json) continue;

        try {
          const obj = JSON.parse(json) as GeminiResponse;
          if (obj.error) {
            console.error('[gemini:stream] api error:', obj.error.code, obj.error.message);
            return;
          }
          if (obj.usageMetadata) lastUsage = obj.usageMetadata;

          const delta = (obj.candidates?.[0]?.content?.parts ?? [])
            .map(p => p.text ?? '')
            .join('');
          if (delta) {
            fullText += delta;
            yield { type: 'delta', text: delta };
          }
        } catch (e) {
          console.warn('[gemini:stream] bad chunk:', e);
        }
      }
    }

    yield {
      type:  'done',
      text:  fullText,
      usage: usageFromGemini(lastUsage),
    };
  } catch (e) {
    console.error('[gemini:stream] read failed:', e);
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}

/**
 * Map Gemini's usage shape to our ClaudeUsage. Gemini's free tier doesn't
 * expose cache stats, so cachedTokens is always 0. Token accounting still
 * works against the same subscription counter — billing semantics are
 * preserved.
 */
function usageFromGemini(u: GeminiUsage | undefined): ClaudeUsage {
  return {
    inputTokens:  u?.promptTokenCount     ?? 0,
    outputTokens: u?.candidatesTokenCount ?? 0,
    cachedTokens: 0,
  };
}
