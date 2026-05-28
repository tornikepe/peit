// Feature #5: fast sentiment classifier for incoming user messages.
//
// We hit Claude Haiku with a tight single-word prompt and parse the first
// matching token from the reply. Failures (no API key, network error,
// unparseable output) silently return null so the chat hot path never
// blocks on this.

import Anthropic from '@anthropic-ai/sdk';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'frustrated';
const ALL: Sentiment[] = ['positive', 'neutral', 'negative', 'frustrated'];

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

const SYSTEM = `Classify the sentiment of the user's message as exactly one of:
positive | neutral | negative | frustrated

Return only the single word — no explanation, no punctuation.`;

export async function classifySentiment(text: string): Promise<Sentiment | null> {
  const c = getClient();
  if (!c) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const res = await c.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 8,
      // No prompt cache here — the system block is short and changes never;
      // Anthropic's minimum cacheable size is well above 50 tokens.
      system: SYSTEM,
      messages: [{ role: 'user', content: trimmed.slice(0, 1000) }],
    });
    const block = res.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') return null;
    const word = block.text.toLowerCase().trim().split(/\s+/)[0];
    if (ALL.includes(word as Sentiment)) return word as Sentiment;
    return null;
  } catch (e) {
    console.warn('[sentiment] classify failed:', e);
    return null;
  }
}
