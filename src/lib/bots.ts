// Bot data layer — localStorage-backed for MVP, swap with API later.

export type BotLang = 'ka' | 'en' | 'ru';
export type BotTone = 'professional' | 'friendly' | 'casual';
export type BotStatus = 'draft' | 'active' | 'paused';

export interface FAQItem {
  id: string;
  q: string;
  a: string;
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
  websiteUrl?: string;
  brandColor: string;
  leadCapture: {
    enabled: boolean;
    fields: ('name' | 'email' | 'phone')[];
  };
  status: BotStatus;
  createdAt: string;
  updatedAt: string;
  // Mock metrics
  stats: {
    messages: number;
    leads: number;
    conversations: number;
  };
}

export const INDUSTRIES = [
  { slug: 'restaurants',     label: 'რესტორნები / კაფე' },
  { slug: 'ecommerce',       label: 'ონლაინ მაღაზია' },
  { slug: 'hotels',          label: 'სასტუმროები' },
  { slug: 'beauty',          label: 'სალონი / ესთეტიკა' },
  { slug: 'medical',         label: 'კლინიკა / სამედიცინო' },
  { slug: 'realestate',      label: 'უძრავი ქონება' },
  { slug: 'education',       label: 'განათლება / კურსები' },
  { slug: 'fitness',         label: 'სპორტი / ფიტნესი' },
  { slug: 'services',        label: 'სხვა სერვისი' },
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
    brandColor: '#7c3aed',
    leadCapture: { enabled: true, fields: ['name', 'email'] },
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    stats: { messages: 0, leads: 0, conversations: 0 },
    ...partial,
  };
}

// ─── Bot logic ─────────────────────────────────────────────────────────────

/**
 * Match a user message against a bot's FAQs.
 * Returns the FAQ answer or null. Simple keyword/substring scoring for MVP.
 */
export function matchFaq(input: string, bot: Bot): string | null {
  const q = input.toLowerCase().trim();
  if (!q) return null;
  let best: { score: number; answer: string } | null = null;

  for (const faq of bot.faqs) {
    const fq = faq.q.toLowerCase();
    let score = 0;

    if (fq === q) score += 100;
    if (fq.includes(q) || q.includes(fq)) score += 30;

    // Word overlap
    const qWords = q.split(/\s+/).filter(w => w.length > 2);
    const fqWords = fq.split(/\s+/).filter(w => w.length > 2);
    for (const w of qWords) {
      if (fqWords.some(fw => fw.includes(w) || w.includes(fw))) score += 10;
    }

    if (score > 15 && (!best || score > best.score)) {
      best = { score, answer: faq.a };
    }
  }
  return best?.answer ?? null;
}

export function botReply(input: string, bot: Bot, lang: BotLang): string {
  const matched = matchFaq(input, bot);
  if (matched) return matched;
  return bot.fallback[lang] ?? bot.fallback[bot.primaryLang] ?? DEFAULT_FALLBACKS[lang];
}
