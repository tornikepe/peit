// Browser-side fetch helpers. Throws on non-2xx; the BotsContext
// catches DB_NOT_CONFIGURED and falls back to localStorage.

import type { Bot } from './bots';

export class ApiError extends Error {
  constructor(public code: string, public status: number, msg?: string) {
    super(msg || code);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  let body: unknown;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    const b = body as { error?: string; message?: string };
    throw new ApiError(b.error || 'HTTP_ERROR', res.status, b.message);
  }
  return body as T;
}

// ─── User ──────────────────────────────────────────────────────────────────

export async function fetchMe(): Promise<{ id: string; email: string; name: string | null } | null> {
  try {
    const data = await request<{ ok: true; user: { id: string; email: string; name: string | null } }>('/api/me');
    return data.user;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 503 || e.status === 401)) return null;
    throw e;
  }
}

// ─── Bots ──────────────────────────────────────────────────────────────────

export async function apiListBots(): Promise<Bot[]> {
  const data = await request<{ ok: true; bots: Bot[] }>('/api/bots');
  return data.bots;
}

export async function apiCreateBot(bot: Omit<Bot, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Bot> {
  const data = await request<{ ok: true; bot: Bot }>('/api/bots', {
    method: 'POST',
    body: JSON.stringify(bot),
  });
  return data.bot;
}

export async function apiUpdateBot(id: string, patch: Partial<Bot>): Promise<Bot> {
  // Convert FAQ shape (q/a) to API shape — already matches
  const apiPatch: Record<string, unknown> = { ...patch };
  if (Array.isArray(patch.faqs)) {
    apiPatch.faqs = patch.faqs.map(f => ({ q: f.q, a: f.a }));
  }
  if (Array.isArray(patch.knowledgeChunks)) {
    apiPatch.knowledgeChunks = patch.knowledgeChunks.map(c => ({
      heading: c.heading, content: c.content, keywords: c.keywords,
    }));
  }

  const data = await request<{ ok: true; bot: Bot }>(`/api/bots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(apiPatch),
  });
  return data.bot;
}

export async function apiDeleteBot(id: string): Promise<void> {
  await request<{ ok: true }>(`/api/bots/${id}`, { method: 'DELETE' });
}

export async function apiMigrateBots(bots: Bot[]): Promise<{ imported: string[]; failed: { name: string; error: string }[] }> {
  const data = await request<{ ok: true; imported: string[]; failed: { name: string; error: string }[] }>(
    '/api/bots/migrate',
    { method: 'POST', body: JSON.stringify({ bots }) },
  );
  return { imported: data.imported, failed: data.failed };
}
