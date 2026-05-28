// Server-side validation for the per-bot quick-replies list.
// Cheap, no Zod dep needed — the shape is tiny and called on every PATCH.

import type { QuickReply, QuickReplyAction } from './bots';

/** Hard cap so a misuse of the API can't bloat the widget config payload. */
const MAX_REPLIES = 12;
const MAX_LABEL   = 40;
const MAX_VALUE   = 500;

const ACTIONS: ReadonlySet<QuickReplyAction> = new Set(['message', 'url', 'flow']);

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

/**
 * Returns a list of valid QuickReply entries from an unknown input.
 * Drops malformed entries silently — the dashboard shows the surviving list
 * after save, so users get visual feedback without needing a 400.
 */
export function sanitizeQuickReplies(input: unknown): QuickReply[] {
  if (!Array.isArray(input)) return [];

  const out: QuickReply[] = [];
  for (const raw of input) {
    if (out.length >= MAX_REPLIES) break;
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Partial<QuickReply>;
    const label  = typeof r.label === 'string'  ? r.label.trim().slice(0, MAX_LABEL)  : '';
    const action = typeof r.action === 'string' ? r.action                            : '';
    const value  = typeof r.value === 'string'  ? r.value.trim().slice(0, MAX_VALUE)  : '';
    if (!label || !value) continue;
    if (!ACTIONS.has(action as QuickReplyAction)) continue;
    if (action === 'url' && !isHttpUrl(value)) continue;
    out.push({ label, action: action as QuickReplyAction, value });
  }
  return out;
}
