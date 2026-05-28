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

/**
 * A quick-reply pill shown above the widget input.
 *  - `message` — sends `value` as if the visitor typed it.
 *  - `url`     — opens `value` in a new tab (only http/https accepted server-side).
 *  - `flow`    — starts the flow whose id is `value` (see Feature #1).
 */
export type QuickReplyAction = 'message' | 'url' | 'flow';
export interface QuickReply {
  label: string;
  action: QuickReplyAction;
  value: string;
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
  /** Pill buttons shown above the widget input. Undefined or empty = no pills.
   *  Optional so the many places that construct a Bot from a narrower source
   *  (channel webhooks, message handlers) don't have to know about this field. */
  quickReplies?: QuickReply[];
  /** Owner-authored CSS injected into the widget. Empty = no override. */
  customCss?: string;
  /** Empty array = allow any domain. Otherwise widget only loads on listed origins. */
  allowedOrigins: string[];
  /** ISO timestamp when the website was last crawled (null = never re-crawled). */
  lastCrawledAt?: string | null;
  /** Days between auto re-crawls (Feature #8). 0 = disabled. */
  syncIntervalDays?: number;
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
    quickReplies: [],
    allowedOrigins: [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    stats: { messages: 0, leads: 0, conversations: 0 },
    ...partial,
  };
}

// ─── Answer engine ─────────────────────────────────────────────────────────

/**
 * Tokens that carry no topical signal. Without filtering, the FAQ matcher
 * gives points for words like "რა" / "what" / "и" — a single match crosses
 * the threshold and the bot ships an unrelated FAQ as if it were the answer.
 * We observed this in production with one bot replying with hotel marketing
 * copy to every Georgian question that contained "რა".
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  // Georgian — common interrogatives, copulas, pronouns, connectors.
  'და', 'ან', 'რა', 'ეს', 'ის', 'იმ', 'ამ', 'რომ', 'რომელი', 'რომელიც',
  'ვინ', 'სად', 'როდის', 'როგორ', 'რატომ', 'რომელ', 'რას', 'რის',
  'მე', 'შენ', 'ჩვენ', 'თქვენ', 'ისინი',
  'მინდა', 'გინდა', 'გვინდა', 'უნდა',
  'თუ', 'არი', 'არის', 'არიან', 'ვართ', 'ხართ', 'იყო', 'იქნება', 'იქნა',
  'არა', 'კი', 'ხო', 'აღარ', 'ჯერ',
  'აქ', 'იქ', 'ცოტა', 'ბევრი', 'ერთი', 'ორი', 'სამი',
  'ცალკე', 'ერთად', 'შენი', 'ჩემი', 'მისი', 'ჩვენი', 'თქვენი',
  'ხომ', 'ხო', 'სხვა', 'ისე', 'ისეთი', 'ასე', 'ასეთი',
  // English — articles, copulas, common modals, function words.
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'my', 'your', 'our', 'their',
  'what', 'where', 'when', 'how', 'why', 'who', 'which',
  'that', 'this', 'these', 'those',
  'and', 'or', 'but', 'if', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by',
  'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'might',
  'have', 'has', 'had', 'not', 'no', 'yes',
  // Russian — same idea.
  'и', 'в', 'не', 'я', 'ты', 'на', 'что', 'как', 'да', 'но', 'или', 'это', 'эта',
  'мы', 'вы', 'они', 'он', 'она', 'оно', 'для', 'от', 'до', 'без',
]);

/** Tokenise + drop short / stop / numeric tokens. */
function meaningfulTokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[\s,.:!?()«»"'„“”\-\/]+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/**
 * Score how well a user query matches a text. Returns:
 *  - 100 if the (non-trivial) query is a substring of the text
 *  - 0..N based on overlap of meaningful tokens (stopwords ignored)
 * The matcher also returns the count of distinct query words that matched,
 * so callers can require multi-word agreement before treating a FAQ as a
 * confident match.
 */
function scoreMatch(query: string, text: string): { score: number; matched: number } {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q || !t) return { score: 0, matched: 0 };

  // Whole-query substring — most reliable signal, only meaningful if the
  // query itself has substance (otherwise "რა" is "in" almost everything).
  if (q.length >= 8 && t.includes(q)) return { score: 100, matched: 99 };

  const qWords = meaningfulTokens(q);
  const tWords = meaningfulTokens(t);
  if (qWords.length === 0 || tWords.length === 0) return { score: 0, matched: 0 };

  let score = 0;
  const matchedQ = new Set<string>();

  for (const qw of qWords) {
    let hit = false;
    for (const tw of tWords) {
      if (tw === qw)                                      { score += 12; hit = true; break; }
      if (qw.length >= 4 && (tw.includes(qw) || qw.includes(tw))) { score += 6; hit = true; break; }
      // Stem-like prefix match — at least 4 leading chars must agree.
      const minLen = Math.min(qw.length, tw.length);
      if (minLen >= 5 && tw.slice(0, minLen - 1) === qw.slice(0, minLen - 1)) {
        score += 3; hit = true; break;
      }
    }
    if (hit) matchedQ.add(qw);
  }

  return { score, matched: matchedQ.size };
}

/**
 * Return the best FAQ answer when the query clearly matches an existing
 * FAQ question — otherwise null so the RAG/LLM tier can handle it. We
 * deliberately keep this strict; a wrong FAQ answer is worse than no FAQ
 * answer, because the LLM tier can always say "I don't have that info".
 *
 * Confidence rules (any one of them is enough):
 *   - Query is an 8+ char substring of the FAQ question or its answer.
 *   - Multi-word agreement: ≥2 distinct meaningful query tokens match
 *     AND total score ≥ 20.
 *   - Question-side score alone ≥ 24 (lots of overlap with the question).
 */
export function matchFaq(input: string, bot: Bot): string | null {
  let best: { score: number; answer: string } | null = null;

  for (const faq of bot.faqs) {
    const qHit = scoreMatch(input, faq.q);
    const aHit = scoreMatch(input, faq.q + ' ' + faq.a);

    // Take the strongest signal. Question-side wins over answer-side
    // because the question is what the user is paraphrasing.
    const score   = Math.max(qHit.score, aHit.score * 0.5);
    const matched = Math.max(qHit.matched, aHit.matched);

    const confident =
      qHit.score >= 100                  ||   // substring of question
      aHit.score >= 100                  ||   // substring of answer
      qHit.score >= 24                   ||   // strong question agreement
      (score >= 20 && matched >= 2);          // multi-word match

    if (confident && (!best || score > best.score)) {
      best = { score, answer: faq.a };
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
    const headingScore = scoreMatch(input, chunk.heading).score * 1.5; // headings weigh more
    const contentScore = scoreMatch(input, chunk.content).score;
    const keywordScore = chunk.keywords.some(k =>
      input.toLowerCase().includes(k) || k.includes(input.toLowerCase().slice(0, 4))
    ) ? 20 : 0;

    const total = Math.max(headingScore, contentScore) + keywordScore;

    // Require non-trivial relevance — 12+ matches the FAQ tier's spirit and
    // keeps short-prefix matches from surfacing unrelated chunks.
    if (total >= 12 && (!best || total > best.score)) {
      best = { score: total, chunk };
    }
  }

  if (!best) return null;

  // Return heading + content, trimmed to ~300 chars for readability
  const { heading, content } = best.chunk;
  const trimmed = content.length > 300 ? content.slice(0, 297) + '...' : content;
  return heading ? `**${heading}**\n${trimmed}` : trimmed;
}

