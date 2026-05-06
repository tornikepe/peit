// Site analyzer — fetches a URL, extracts content, generates FAQs.
// Server-side only (uses fetch + cheerio).

import * as cheerio from 'cheerio';

export interface SiteAnalysis {
  url: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { href: string; text: string }[];
  contact: {
    emails: string[];
    phones: string[];
    addresses: string[];
  };
  signals: {
    hasPricing: boolean;
    hasHours: boolean;
    hasContact: boolean;
    hasServices: boolean;
    hasBooking: boolean;
    hasShipping: boolean;
  };
  detectedIndustry: string | null;
  language: 'ka' | 'en' | 'ru' | 'mixed';
  pagesScraped: number;
  textSample: string; // first ~2000 chars combined
}

const PHONE_RE  = /\+?\d[\d\s\-().]{7,}\d/g;
const EMAIL_RE  = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

function detectLang(text: string): SiteAnalysis['language'] {
  const ka = (text.match(/[Ⴀ-ჿ]/g) ?? []).length;
  const ru = (text.match(/[Ѐ-ӿ]/g) ?? []).length;
  const en = (text.match(/[a-zA-Z]/g) ?? []).length;
  const total = ka + ru + en;
  if (total < 50) return 'mixed';
  const kaRatio = ka / total, ruRatio = ru / total, enRatio = en / total;
  if (kaRatio > 0.3) return 'ka';
  if (ruRatio > 0.4) return 'ru';
  if (enRatio > 0.6) return 'en';
  return 'mixed';
}

const INDUSTRY_KEYWORDS: { slug: string; keywords: RegExp }[] = [
  { slug: 'restaurants', keywords: /\b(restaurant|menu|cafe|coffee|pizza|cuisine|რესტორან|მენიუ|კაფე|ყავა)/i },
  { slug: 'ecommerce',   keywords: /\b(shop|store|cart|checkout|product|delivery|მაღაზია|შეძენა|პროდუქტი|მიწოდება)/i },
  { slug: 'hotels',      keywords: /\b(hotel|booking|room|stay|guest|სასტუმრო|ოთახი|ჯავშანი)/i },
  { slug: 'beauty',      keywords: /\b(beauty|salon|spa|hair|nail|სალონი|სილამაზე|თმა)/i },
  { slug: 'medical',     keywords: /\b(clinic|doctor|medical|health|patient|კლინიკა|ექიმი|სამედიცინო)/i },
  { slug: 'realestate',  keywords: /\b(real\s*estate|property|apartment|rent|უძრავი|ბინა|ქირავდება)/i },
  { slug: 'education',   keywords: /\b(course|school|education|tutor|კურს|სკოლა|სწავლება|გაკვეთილი)/i },
  { slug: 'fitness',     keywords: /\b(gym|fitness|trainer|workout|სპორტ|ფიტნეს|ვარჯიში)/i },
];

function detectIndustry(text: string): string | null {
  const lower = text.toLowerCase();
  let best: { slug: string; score: number } | null = null;
  for (const { slug, keywords } of INDUSTRY_KEYWORDS) {
    const matches = lower.match(keywords);
    if (matches) {
      const score = matches.length;
      if (!best || score > best.score) best = { slug, score };
    }
  }
  return best?.slug ?? null;
}

function detectSignals(text: string): SiteAnalysis['signals'] {
  const lower = text.toLowerCase();
  return {
    hasPricing:  /\b(price|pricing|cost|\$|€|₾|gel|ფას|ღირებულ)/i.test(lower),
    hasHours:    /\b(hours|open|close|monday|საათ|ღია|დახურულ|ორშ)/i.test(lower),
    hasContact:  /\b(contact|email|phone|address|კონტაქტ|მისამართ)/i.test(lower),
    hasServices: /\b(services|service|offer|სერვის|შემოთავაზებ)/i.test(lower),
    hasBooking:  /\b(book|booking|reserve|appointment|ჯავშან|დაჯავშნა)/i.test(lower),
    hasShipping: /\b(shipping|delivery|courier|მიწოდება|კურიერი|დოსტავკ)/i.test(lower),
  };
}

interface ExtractedPage {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { href: string; text: string }[];
  text: string;
}

async function fetchPage(url: string, timeoutMs = 8000): Promise<ExtractedPage | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PeitBot/1.0; +https://peit.ge/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!res.ok) return null;

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, noscript, svg, iframe, link, meta').remove();

    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').first().text().trim() ||
      '';

    const description =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      '';

    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ');
      if (t && t.length < 200) headings.push(t);
    });

    const paragraphs: string[] = [];
    $('p, li').each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ');
      if (t.length > 20 && t.length < 500) paragraphs.push(t);
    });

    const links: { href: string; text: string }[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (href && text && text.length < 60) links.push({ href, text });
    });

    const text = [
      title,
      description,
      ...headings,
      ...paragraphs,
    ].join(' \n ');

    return { title, description, headings, paragraphs, links, text };
  } catch {
    return null;
  }
}

const INTERNAL_LINK_HINTS = /^(\/?(about|services?|pricing|contact|faq|menu|products?|rooms?|book|info|სერვის|კონტაქტ|ჩვენ-შესახებ|ფას))/i;

function pickInternalLinks(
  baseUrl: string,
  links: { href: string; text: string }[],
  limit = 4,
): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>([base.href, base.href.replace(/\/$/, '')]);
  const out: string[] = [];

  for (const { href, text } of links) {
    if (out.length >= limit) break;
    let abs: string;
    try {
      abs = new URL(href, base).href;
    } catch {
      continue;
    }
    const u = new URL(abs);
    if (u.hostname !== base.hostname) continue;
    if (seen.has(abs)) continue;

    const path = u.pathname;
    const matchesPath = INTERNAL_LINK_HINTS.test(path);
    const matchesText = INTERNAL_LINK_HINTS.test(text);
    if (matchesPath || matchesText) {
      seen.add(abs);
      out.push(abs);
    }
  }
  return out;
}

export async function analyzeSite(rawUrl: string): Promise<SiteAnalysis> {
  const url = normalizeUrl(rawUrl);

  const main = await fetchPage(url);
  if (!main) {
    throw new Error('Could not fetch the website. Make sure the URL is correct and publicly accessible.');
  }

  // Crawl up to 3 useful internal pages
  const internal = pickInternalLinks(url, main.links, 3);
  const subPages = await Promise.all(internal.map(u => fetchPage(u, 6000)));

  const allHeadings = [...main.headings];
  const allParagraphs = [...main.paragraphs];
  let allText = main.text;
  let pagesScraped = 1;

  for (const p of subPages) {
    if (p) {
      allHeadings.push(...p.headings);
      allParagraphs.push(...p.paragraphs);
      allText += '\n' + p.text;
      pagesScraped++;
    }
  }

  // Dedupe
  const uniqueHeadings = Array.from(new Set(allHeadings)).slice(0, 30);
  const uniqueParagraphs = Array.from(new Set(allParagraphs)).slice(0, 50);

  // Contact extraction
  const emails = Array.from(new Set(allText.match(EMAIL_RE) ?? []))
    .filter(e => !/(\.png|\.jpg|\.svg|sentry|wixpress|example)/i.test(e))
    .slice(0, 5);
  const phones = Array.from(new Set((allText.match(PHONE_RE) ?? []).map(s => s.trim())))
    .filter(p => p.replace(/\D/g, '').length >= 7 && p.replace(/\D/g, '').length <= 15)
    .slice(0, 5);
  const addresses: string[] = [];
  for (const p of uniqueParagraphs) {
    if (/(street|str\.|avenue|ave\.|ქუჩა|გამზირი|улица|проспект)/i.test(p) && p.length < 200) {
      addresses.push(p);
      if (addresses.length >= 3) break;
    }
  }

  return {
    url,
    title: main.title,
    description: main.description,
    headings: uniqueHeadings,
    paragraphs: uniqueParagraphs,
    links: main.links.slice(0, 30),
    contact: { emails, phones, addresses },
    signals: detectSignals(allText),
    detectedIndustry: detectIndustry(allText),
    language: detectLang(allText),
    pagesScraped,
    textSample: allText.slice(0, 4000),
  };
}

// ─── FAQ generation ────────────────────────────────────────────────────────

interface GeneratedFaq {
  q: string;
  a: string;
}

const TEMPLATES = {
  ka: {
    about:    { q: 'რას აკეთებთ?',                a: (ctx: string) => ctx },
    pricing:  { q: 'რამდენი ღირს?',                a: (ctx: string) => ctx || 'ფასები იხილეთ ჩვენი სერვისის გვერდზე ან დაგვიკავშირდით.' },
    hours:    { q: 'რა საათებზე ხართ ღია?',        a: (ctx: string) => ctx || 'სამუშაო საათების შესახებ დაუკავშირდით ჩვენს გუნდს.' },
    contact:  { q: 'როგორ დაგიკავშირდე?',          a: (ctx: string) => ctx },
    services: { q: 'რა სერვისებს სთავაზობთ?',      a: (ctx: string) => ctx },
    booking:  { q: 'როგორ დავჯავშნო?',              a: (ctx: string) => ctx || 'ჯავშნის გასაკეთებლად დაგვიკავშირდით ან ეწვიეთ ჩვენს ვებსაიტს.' },
    shipping: { q: 'მიწოდება ხდება?',                a: (ctx: string) => ctx || 'მიწოდების შესახებ დეტალები იხილეთ ვებსაიტზე.' },
    location: { q: 'სად მდებარეობთ?',                a: (ctx: string) => ctx },
  },
  en: {
    about:    { q: 'What do you do?',                  a: (c: string) => c },
    pricing:  { q: 'How much does it cost?',           a: (c: string) => c || 'Please see our services page or get in touch for pricing.' },
    hours:    { q: 'What are your opening hours?',     a: (c: string) => c || 'Contact us for current hours.' },
    contact:  { q: 'How can I contact you?',           a: (c: string) => c },
    services: { q: 'What services do you offer?',      a: (c: string) => c },
    booking:  { q: 'How can I book?',                   a: (c: string) => c || 'Please contact us or visit our website to book.' },
    shipping: { q: 'Do you offer delivery?',            a: (c: string) => c || 'See our website for delivery details.' },
    location: { q: 'Where are you located?',            a: (c: string) => c },
  },
  ru: {
    about:    { q: 'Чем вы занимаетесь?',              a: (c: string) => c },
    pricing:  { q: 'Сколько стоит?',                    a: (c: string) => c || 'Цены смотрите на странице услуг или свяжитесь с нами.' },
    hours:    { q: 'Какие у вас часы работы?',         a: (c: string) => c || 'Свяжитесь с нами для уточнения часов работы.' },
    contact:  { q: 'Как с вами связаться?',             a: (c: string) => c },
    services: { q: 'Какие услуги вы предлагаете?',     a: (c: string) => c },
    booking:  { q: 'Как мне забронировать?',           a: (c: string) => c || 'Свяжитесь с нами или посетите наш сайт.' },
    shipping: { q: 'Есть ли у вас доставка?',           a: (c: string) => c || 'Подробности о доставке смотрите на сайте.' },
    location: { q: 'Где вы находитесь?',                a: (c: string) => c },
  },
} as const;

/** Find paragraphs that match topic-related keywords. */
function findContext(paragraphs: string[], pattern: RegExp, max = 2): string {
  const matches = paragraphs.filter(p => pattern.test(p)).slice(0, max);
  return matches.join(' ');
}

export function generateFaqsFromAnalysis(
  analysis: SiteAnalysis,
  lang: 'ka' | 'en' | 'ru' = 'ka',
): GeneratedFaq[] {
  const t = TEMPLATES[lang];
  const out: GeneratedFaq[] = [];
  const { paragraphs, signals, contact, description, title } = analysis;

  // About
  const aboutCtx = description || paragraphs[0] || '';
  if (aboutCtx) out.push({ q: t.about.q, a: t.about.a(aboutCtx) });

  // Services
  if (signals.hasServices) {
    const ctx = findContext(paragraphs, /service|offer|სერვის|шемოთავაზებ|услуг|предлаг/i);
    if (ctx) out.push({ q: t.services.q, a: t.services.a(ctx) });
  }

  // Pricing
  if (signals.hasPricing) {
    const ctx = findContext(paragraphs, /\$|€|₾|gel|price|cost|ფას|ღირ|цен|стои/i);
    out.push({ q: t.pricing.q, a: t.pricing.a(ctx) });
  }

  // Hours
  if (signals.hasHours) {
    const ctx = findContext(paragraphs, /hours|open|monday|საათ|ღია|пн|часов/i);
    out.push({ q: t.hours.q, a: t.hours.a(ctx) });
  }

  // Booking
  if (signals.hasBooking) {
    const ctx = findContext(paragraphs, /book|reserv|appoint|ჯავშან|резерв|записать/i);
    out.push({ q: t.booking.q, a: t.booking.a(ctx) });
  }

  // Shipping
  if (signals.hasShipping) {
    const ctx = findContext(paragraphs, /ship|deliver|courier|მიწოდ|кур|доставк/i);
    out.push({ q: t.shipping.q, a: t.shipping.a(ctx) });
  }

  // Location
  if (contact.addresses.length > 0) {
    out.push({ q: t.location.q, a: t.location.a(contact.addresses.join(' · ')) });
  }

  // Contact
  if (contact.emails.length || contact.phones.length) {
    const parts = [
      contact.phones[0] && `📞 ${contact.phones[0]}`,
      contact.emails[0] && `✉️ ${contact.emails[0]}`,
    ].filter(Boolean) as string[];
    if (parts.length) out.push({ q: t.contact.q, a: t.contact.a(parts.join('  ·  ')) });
  }

  return out.filter(f => f.q && f.a).slice(0, 10);
}

// ─── Optional: AI enhancement (Anthropic Claude) ──────────────────────────
// Activates only if ANTHROPIC_API_KEY is set in env.

export async function aiEnhanceFaqs(
  analysis: SiteAnalysis,
  lang: 'ka' | 'en' | 'ru',
): Promise<GeneratedFaq[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const langName = lang === 'ka' ? 'Georgian' : lang === 'ru' ? 'Russian' : 'English';

  const prompt = `You are analyzing a business website to generate a customer FAQ.

WEBSITE: ${analysis.url}
TITLE: ${analysis.title}
DESCRIPTION: ${analysis.description}
DETECTED INDUSTRY: ${analysis.detectedIndustry ?? 'unknown'}

CONTENT EXCERPT:
${analysis.textSample.slice(0, 3000)}

Generate 6-10 likely customer questions (FAQ) in ${langName} language with concise answers based ONLY on the content above. Output strict JSON array, no prose:
[{"q":"question","a":"answer"}, ...]

Rules: questions short and natural; answers 1-2 sentences max; if pricing/hours/etc not in content, write a polite "contact us" answer.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as GeneratedFaq[];
    return parsed.filter(f => f.q && f.a).slice(0, 10);
  } catch {
    return null;
  }
}
