// Bot data layer — localStorage-backed for MVP, swap with API later.

export type BotLang = 'ka' | 'en' | 'ru';
export type BotTone = 'professional' | 'friendly' | 'casual';
export type BotStatus = 'draft' | 'active' | 'paused';

export interface FAQItem {
  id: string;
  q: string;
  a: string;
}

/** A scraped content chunk from the website — heading + body text. */
export interface KnowledgeChunk {
  id: string;
  heading: string; // h1/h2/h3 or page section label
  content: string; // paragraph(s) under that heading
  keywords: string[]; // pre-extracted lowercase keywords for fast matching
}

export interface Bot {
  id: string;
  name: string;
  industry: string;
  languages: BotLang[];
  primaryLang: BotLang;
  tone: BotTone;
  greeting: Partial<Record<BotLang, string>>;
  fallback: Partial<Record<BotLang, string>>;
  faqs: FAQItem[];
  /** Full scraped content — used for knowledge search when FAQ doesn't match */
  knowledgeChunks: KnowledgeChunk[];
  websiteUrl?: string;
  brandColor: string;
  leadCapture: {
    enabled: boolean;
    fields: ('name' | 'email' | 'phone')[];
  };
  status: BotStatus;
  createdAt: string;
  updatedAt: string;
  stats: {
    messages: number;
    leads: number;
    conversations: number;
  };
}

export const INDUSTRIES = [
  { slug: 'restaurants',  label: 'რესტორნები / კაფე' },
  { slug: 'ecommerce',    label: 'ონლაინ მაღაზია' },
  { slug: 'hotels',       label: 'სასტუმროები' },
  { slug: 'beauty',       label: 'სალონი / ესთეტიკა' },
  { slug: 'medical',      label: 'კლინიკა / სამედიცინო' },
  { slug: 'realestate',   label: 'უძრავი ქონება' },
  { slug: 'education',    label: 'განათლება / კურსები' },
  { slug: 'fitness',      label: 'სპორტი / ფიტნესი' },
  { slug: 'services',     label: 'სხვა სერვისი' },
] as const;

export const TONES: { value: BotTone; label: string; emoji: string; desc: string }[] = [
  { value: 'professional', emoji: '🎩', label: 'პროფესიონალური', desc: 'ფორმალური, ნდობის მქონე ტონი' },
  { value: 'friendly',     emoji: '😊', label: 'მეგობრული',      desc: 'თბილი და მისასალმებელი' },
  { value: 'casual',       emoji: '🤙', label: 'არაფორმალური',   desc: 'მსუბუქი და გაცოცხლებული' },
];

export const DEFAULT_GREETINGS: Record<BotLang, string> = {
  ka: 'გამარჯობა! 👋 როგორ შემიძლია დაგეხმარო?',
  en: 'Hi there! 👋 How can I help you today?',
  ru: 'Здравствуйте! 👋 Чем могу помочь?',
};

export const DEFAULT_FALLBACKS: Record<BotLang, string> = {
  ka: 'სამწუხაროდ ამ კითხვაზე ზუსტი პასუხი არ მაქვს. დატოვე კონტაქტი და ჩვენი გუნდი დაგიკავშირდება.',
  en: 'I don\'t have an exact answer for that. Leave your contact and our team will reach out.',
  ru: 'У меня нет точного ответа. Оставьте контакт, и наша команда свяжется с вами.',
};

export const BRAND_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#ea580c', '#dc2626', '#db2777', '#475569',
];

const STORAGE_KEY = 'peit-bots';

// ─── CRUD ──────────────────────────────────────────────────────────────────

export function loadBots(): Bot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Bot[]) : [];
  } catch {
    return [];
  }
}

export function saveBots(bots: Bot[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

export function createBotId(): string {
  return 'bot_' + Math.random().toString(36).slice(2, 10);
}

export function createFaqId(): string {
  return 'faq_' + Math.random().toString(36).slice(2, 8);
}

export function createChunkId(): string {
  return 'ck_' + Math.random().toString(36).slice(2, 8);
}

export function makeNewBot(partial: Partial<Bot> = {}): Bot {
  const now = new Date().toISOString();
  return {
    id: createBotId(),
    name: '',
    industry: 'services',
    languages: ['ka'],
    primaryLang: 'ka',
    tone: 'friendly',
    greeting: { ka: DEFAULT_GREETINGS.ka },
    fallback: { ka: DEFAULT_FALLBACKS.ka },
    faqs: [],
    knowledgeChunks: [],
    brandColor: '#7c3aed',
    leadCapture: { enabled: true, fields: ['name', 'email'] },
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    stats: { messages: 0, leads: 0, conversations: 0 },
    ...partial,
  };
}

// ─── Answer engine ─────────────────────────────────────────────────────────

/**
 * Score how well a user query matches a text.
 * - Exact substring: high score
 * - Word-by-word overlap: medium score
 * - Partial word/stem match: low score
 */
function scoreMatch(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q || !t) return 0;

  let score = 0;

  // Exact substring
  if (t.includes(q)) return 80;

  // Split both into tokens (words ≥ 2 chars)
  const qWords = q.split(/[\s,.:!?]+/).filter(w => w.length >= 2);
  const tWords = t.split(/[\s,.:!?]+/).filter(w => w.length >= 2);

  for (const qw of qWords) {
    for (const tw of tWords) {
      if (tw === qw) { score += 12; break; }
      if (tw.includes(qw) || qw.includes(tw)) { score += 6; break; }
      // Prefix match (handles Georgian morphology somewhat)
      const minLen = Math.min(qw.length, tw.length);
      if (minLen >= 3 && tw.slice(0, minLen - 1) === qw.slice(0, minLen - 1)) {
        score += 3; break;
      }
    }
  }

  return score;
}

/**
 * Search FAQ list. Returns best matching answer or null.
 * Threshold 15 to avoid false positives.
 */
export function matchFaq(input: string, bot: Bot): string | null {
  let best: { score: number; answer: string } | null = null;

  for (const faq of bot.faqs) {
    // Score against the question AND the answer text so even off-phrasing works
    const s = Math.max(
      scoreMatch(input, faq.q),
      scoreMatch(input, faq.q + ' ' + faq.a) * 0.6,
    );
    if (s >= 12 && (!best || s > best.score)) {
      best = { score: s, answer: faq.a };
    }
  }

  return best?.answer ?? null;
}

/**
 * Search the scraped knowledge chunks for relevant content.
 * Returns the best matching chunk's content, or null.
 * Threshold 8 — looser than FAQ because content is longer.
 */
export function searchKnowledge(input: string, bot: Bot): string | null {
  if (!bot.knowledgeChunks || bot.knowledgeChunks.length === 0) return null;

  let best: { score: number; chunk: KnowledgeChunk } | null = null;

  for (const chunk of bot.knowledgeChunks) {
    const headingScore = scoreMatch(input, chunk.heading) * 1.5; // headings weigh more
    const contentScore = scoreMatch(input, chunk.content);
    const keywordScore = chunk.keywords.some(k =>
      input.toLowerCase().includes(k) || k.includes(input.toLowerCase().slice(0, 4))
    ) ? 20 : 0;

    const total = Math.max(headingScore, contentScore) + keywordScore;

    if (total >= 8 && (!best || total > best.score)) {
      best = { score: total, chunk };
    }
  }

  if (!best) return null;

  // Return heading + content, trimmed to ~300 chars for readability
  const { heading, content } = best.chunk;
  const trimmed = content.length > 300 ? content.slice(0, 297) + '...' : content;
  return heading ? `**${heading}**\n${trimmed}` : trimmed;
}

/**
 * Main reply function — 3-tier lookup:
 * 1. FAQ exact/keyword match
 * 2. Knowledge chunk search (scraped website content)
 * 3. Fallback message
 */
export function botReply(
  input: string,
  bot: Bot,
  lang: BotLang,
): { text: string; source: 'faq' | 'knowledge' | 'fallback' } {
  // Tier 1: FAQ
  const faqAnswer = matchFaq(input, bot);
  if (faqAnswer) return { text: faqAnswer, source: 'faq' };

  // Tier 2: Knowledge base
  const knowledgeAnswer = searchKnowledge(input, bot);
  if (knowledgeAnswer) return { text: knowledgeAnswer, source: 'knowledge' };

  // Tier 3: Fallback
  const fallback =
    bot.fallback[lang] ??
    bot.fallback[bot.primaryLang] ??
    DEFAULT_FALLBACKS[lang];
  return { text: fallback, source: 'fallback' };
}
