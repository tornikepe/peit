// Voyage AI embeddings client — Anthropic's official embedding partner.
// 200M tokens/month free tier. https://docs.voyageai.com
//
// Returns null when VOYAGE_API_KEY is not set — callers should fall back
// to keyword-based search.

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-3';

export const EMBEDDING_DIMS = 1024;

export function isEmbeddingsAvailable(): boolean {
  return !!process.env.VOYAGE_API_KEY;
}

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
  model: string;
}

/**
 * Embed a batch of texts. Returns null if the service is unavailable
 * or any call fails — callers fall back to keyword retrieval.
 *
 * @param texts        list of strings to embed (max 128 per call)
 * @param input_type   'document' for chunks, 'query' for questions —
 *                     improves retrieval quality
 */
export async function embedBatch(
  texts: string[],
  input_type: 'document' | 'query' = 'document',
): Promise<number[][] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || texts.length === 0) return null;

  // Voyage limits: 128 texts per call, ~10K tokens per text. We chunk safely.
  const BATCH = 128;
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map(t => t.slice(0, 32_000));
    try {
      const res = await fetch(VOYAGE_API, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type':  'application/json',
        },
        body: JSON.stringify({ input: batch, model: MODEL, input_type }),
      });
      if (!res.ok) {
        console.error('[embeddings] Voyage error:', res.status, await res.text());
        return null;
      }
      const data = (await res.json()) as VoyageResponse;
      // Sort by index to preserve input order
      data.data.sort((a, b) => a.index - b.index);
      for (const d of data.data) out.push(d.embedding);
    } catch (e) {
      console.error('[embeddings] Voyage failed:', e);
      return null;
    }
  }

  return out;
}

/** Convenience: embed a single string. */
export async function embedOne(
  text: string,
  input_type: 'document' | 'query' = 'query',
): Promise<number[] | null> {
  const result = await embedBatch([text], input_type);
  return result?.[0] ?? null;
}

/**
 * Format an embedding array for direct injection into a Postgres SQL
 * literal: vector strings look like '[0.1, 0.2, ...]'.
 */
export function toPgVector(emb: number[]): string {
  return '[' + emb.join(',') + ']';
}
