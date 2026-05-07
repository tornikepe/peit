// Site analyzer — fetches a URL, extracts structured content, generates FAQs.
// Server-side only (uses fetch + cheerio).

import * as cheerio from 'cheerio';
import type { KnowledgeChunk } from './bots';

export interface SiteSection {
  heading: string;
  paragraphs: string[];
}

export interface SiteAnalysis {
  url: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  sections: SiteSection[];   // structured: heading + body paragraphs
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
  textSample: string;
}

const PHONE_RE = /\+?\d[\d\s\-().]{7,}\d/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

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
  if (ka / total > 0.3) return 'ka';
  if (ru / total > 0.4) return 'ru';
  if (en / total > 0.6) return 'en';
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
  let best: { slug: string; score: number } | null = null;
  for (const { slug, keywords } of INDUSTRY_KEYWORDS) {
    const matches = text.match(keywords);
    if (matches) {
      const score = matches.length;
      if (!best || score > best.score) best = { slug, score };
    }
  }
  return best?.slug ?? null;
}

function detectSignals(text: string): SiteAnalysis['signals'] {
  return {
    hasPricing:  /\b(price|pricing|cost|\$|€|₾|gel|ფას|ღირებულ)/i.test(text),
    hasHours:    /\b(hours|open|close|monday|საათ|ღია|დახურულ|ორშ)/i.test(text),
    hasContact:  /\b(contact|email|phone|address|კონტაქტ|მისამართ)/i.test(text),
    hasServices: /\b(services|service|offer|სერვის|შემოთავაზებ)/i.test(text),
    hasBooking:  /\b(book|booking|reserve|appointment|ჯავშან|დაჯავშნა)/i.test(text),
    hasShipping: /\b(shipping|delivery|courier|მიწოდება|კურიერი|დოსტავკ)/i.test(text),
  };
}

interface ExtractedPage {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  sections: SiteSection[];
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
    if (!(res.headers.get('content-type') || '').includes('text/html')) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    $('script, style, noscript, svg, iframe, nav, footer, header').remove();

    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').first().text().trim() || '';

    const description =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() || '';

    // ── Structured section extraction ──────────────────────────────────────
    // Walk the DOM in order: when we hit a heading, start a new section.
    // Collect paragraphs/lists under each heading until the next heading.
    const sections: SiteSection[] = [];
    let currentHeading = title || 'General';
    let currentParas: string[] = [];

    // Push an intro section with description if it exists
    if (description) {
      sections.push({ heading: 'About', paragraphs: [description] });
    }

    const mainContent = $('main, article, [role="main"], .content, #content, body').first();
    const container = mainContent.length ? mainContent : $('body');

    container.children().each((_, el) => {
      const tagName = (el as { tagName?: string }).tagName?.toLowerCase() ?? '';

      if (['h1', 'h2', 'h3'].includes(tagName)) {
        // Save previous section
        if (currentParas.length > 0) {
          sections.push({ heading: currentHeading, paragraphs: [...currentParas] });
        }
        currentHeading = $(el).text().trim().replace(/\s+/g, ' ');
        currentParas = [];
      } else if (['p', 'li', 'span', 'div'].includes(tagName)) {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text.length > 25 && text.length < 600) {
          currentParas.push(text);
        }
      } else if (['ul', 'ol'].includes(tagName)) {
        // Flatten list items into one chunk
        const items: string[] = [];
        $(el).find('li').each((_, li) => {
          const t = $(li).text().trim().replace(/\s+/g, ' ');
          if (t.length > 5) items.push('• ' + t);
        });
        if (items.length) currentParas.push(items.join('\n'));
      }
    });

    // Push last section
    if (currentParas.length > 0) {
      sections.push({ heading: currentHeading, paragraphs: [...currentParas] });
    }

    // Also do a flat extraction as fallback
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
      if (href && text && text.length < 80) links.push({ href, text });
    });

    const text = [title, description, ...headings, ...paragraphs].join('\n');
    return { title, description, headings, paragraphs, sections, links, text };
  } catch {
    return null;
  }
}

const INTERNAL_LINK_HINTS =
  /^(\/?)(about|services?|pricing|contact|faq|menu|products?|rooms?|book|info|სერვის|კონტაქტ|ჩვენ-შესახებ|ფას)/i;

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
    try { abs = new URL(href, base).href; } catch { continue; }
    const u = new URL(abs);
    if (u.hostname !== base.hostname) continue;
    if (seen.has(abs)) continue;
    const path = u.pathname;
    if (INTERNAL_LINK_HINTS.test(path) || INTERNAL_LINK_HINTS.test(text)) {
      seen.add(abs);
      out.push(abs);
    }
  }
  return out;
}

// ─── Main analyzer ──────────────────────────────────────────────────────────

export async function analyzeSite(rawUrl: string): Promise<SiteAnalysis> {
  const url = normalizeUrl(rawUrl);

  const main = await fetchPage(url);
  if (!main) {
    throw new Error(
      'ვებსაიტი ვერ წაიკითხა. შეამოწმე URL და ინტერნეტი.',
    );
  }

  const internal = pickInternalLinks(url, main.links, 3);
  const subPages = await Promise.all(internal.map(u => fetchPage(u, 6000)));

  const allHeadings = [...main.headings];
  const allParagraphs = [...main.paragraphs];
  const allSections = [...main.sections];
  let allText = main.text;
  let pagesScraped = 1;

  for (const p of subPages) {
    if (p) {
      allHeadings.push(...p.headings);
      allParagraphs.push(...p.paragraphs);
      allSections.push(...p.sections);
      allText += '\n' + p.text;
      pagesScraped++;
    }
  }

  const uniqueHeadings = Array.from(new Set(allHeadings)).slice(0, 30);
  const uniqueParagraphs = Array.from(new Set(allParagraphs)).slice(0, 60);

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
    sections: allSections,
    links: main.links.slice(0, 30),
    contact: { emails, phones, addresses },
    signals: detectSignals(allText),
    detectedIndustry: detectIndustry(allText),
    language: detectLang(allText),
    pagesScraped,
    textSample: allText.slice(0, 5000),
  };
}

// ─── Knowledge chunks ────────────────────────────────────────────────────────
// Converts SiteAnalysis into KnowledgeChunk[] for bot storage.

function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[\s,.:!?()\[\]{}'"]+/)
        .filter(w => w.length >= 3)
        .slice(0, 30),
    ),
  );
}

export function buildKnowledgeChunks(analysis: SiteAnalysis): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const seen = new Set<string>();

  // 1. Structured sections (best quality — heading + grouped paragraphs)
  for (const section of analysis.sections) {
    if (!section.paragraphs.length) continue;
    const content = section.paragraphs
      .filter(p => p.length > 20)
      .join('\n')
      .slice(0, 800);
    if (!content) continue;

    const key = content.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);

    chunks.push({
      id: 'ck_' + Math.random().toString(36).slice(2, 8),
      heading: section.heading,
      content,
      keywords: extractKeywords(section.heading + ' ' + content),
    });
  }

  // 2. Fallback: if sections were sparse, add flat paragraphs as generic chunks
  if (chunks.length < 3) {
    const buckets: Record<string, string[]> = {
      Pricing:  [],
      Hours:    [],
      Contact:  [],
      Services: [],
      General:  [],
    };
    for (const p of analysis.paragraphs) {
      if (/ფას|price|cost|₾|\$|€/i.test(p))           buckets.Pricing.push(p);
      else if (/საათ|hour|open|monday|ორშ/i.test(p))   buckets.Hours.push(p);
      else if (/კონტაქტ|contact|phone|email/i.test(p)) buckets.Contact.push(p);
      else if (/სერვის|service|offer/i.test(p))        buckets.Services.push(p);
      else                                              buckets.General.push(p);
    }
    for (const [heading, paras] of Object.entries(buckets)) {
      if (!paras.length) continue;
      const content = paras.join('\n').slice(0, 600);
      const key = content.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      chunks.push({
        id: 'ck_' + Math.random().toString(36).slice(2, 8),
        heading,
        content,
        keywords: extractKeywords(heading + ' ' + content),
      });
    }
  }

  // 3. Contact chunk if we found real contact info
  const { emails, phones, addresses } = analysis.contact;
  if (emails.length || phones.length || addresses.length) {
    const parts = [
      phones[0] && `📞 ${phones[0]}`,
      emails[0] && `✉️ ${emails[0]}`,
      addresses[0] && `📍 ${addresses[0]}`,
    ].filter(Boolean).join('\n');
    if (parts) {
      chunks.push({
        id: 'ck_' + Math.random().toString(36).slice(2, 8),
        heading: 'Contact Information',
        content: parts,
        keywords: ['contact', 'phone', 'email', 'address', 'კონტაქტი', 'ტელეფონი'],
      });
    }
  }

  return chunks.slice(0, 30); // cap at 30 chunks to keep localStorage small
}

// ─── FAQ generation ─────────────────────────────────────────────────────────

interface GeneratedFaq { q: string; a: string; }

const TEMPLATES = {
  ka: {
    about:    { q: 'რას აკეთებთ?',                a: (c: string) => c },
    pricing:  { q: 'რამდენი ღირს?',                a: (c: string) => c || 'ფასები იხილეთ ჩვენი სერვისის გვერდზე ან დაგვიკავშირდით.' },
    hours:    { q: 'რა საათებზე ხართ ღია?',        a: (c: string) => c || 'სამუშაო საათების შესახებ დაუკავშირდით ჩვენს გუნდს.' },
    contact:  { q: 'როგორ დაგიკავშირდე?',          a: (c: string) => c },
    services: { q: 'რა სერვისებს სთავაზობთ?',      a: (c: string) => c },
    booking:  { q: 'როგორ დავჯავშნო?',              a: (c: string) => c || 'ჯავშნის გასაკეთებლად დაგვიკავშირდით ან ეწვიეთ ჩვენს ვებსაიტს.' },
    shipping: { q: 'მიწოდება ხდება?',               a: (c: string) => c || 'მიწოდების შესახებ დეტალები იხილეთ ვებსაიტზე.' },
    location: { q: 'სად მდებარეობთ?',               a: (c: string) => c },
  },
  en: {
    about:    { q: 'What do you do?',               a: (c: string) => c },
    pricing:  { q: 'How much does it cost?',        a: (c: string) => c || 'Please see our services page or get in touch.' },
    hours:    { q: 'What are your opening hours?',  a: (c: string) => c || 'Contact us for current hours.' },
    contact:  { q: 'How can I contact you?',        a: (c: string) => c },
    services: { q: 'What services do you offer?',   a: (c: string) => c },
    booking:  { q: 'How can I book?',               a: (c: string) => c || 'Contact us or visit our website.' },
    shipping: { q: 'Do you offer delivery?',        a: (c: string) => c || 'See our website for delivery details.' },
    location: { q: 'Where are you located?',        a: (c: string) => c },
  },
  ru: {
    about:    { q: 'Чем вы занимаетесь?',           a: (c: string) => c },
    pricing:  { q: 'Сколько стоит?',                a: (c: string) => c || 'Цены на странице услуг или свяжитесь с нами.' },
    hours:    { q: 'Какие у вас часы работы?',      a: (c: string) => c || 'Свяжитесь с нами.' },
    contact:  { q: 'Как с вами связаться?',         a: (c: string) => c },
    services: { q: 'Какие услуги вы предлагаете?',  a: (c: string) => c },
    booking:  { q: 'Как мне забронировать?',        a: (c: string) => c || 'Свяжитесь с нами или посетите сайт.' },
    shipping: { q: 'Есть ли у вас доставка?',       a: (c: string) => c || 'Подробности на сайте.' },
    location: { q: 'Где вы находитесь?',            a: (c: string) => c },
  },
} as const;

function findContext(paragraphs: string[], pattern: RegExp, max = 2): string {
  return paragraphs.filter(p => pattern.test(p)).slice(0, max).join(' ');
}

export function generateFaqsFromAnalysis(
  analysis: SiteAnalysis,
  lang: 'ka' | 'en' | 'ru' = 'ka',
): GeneratedFaq[] {
  const t = TEMPLATES[lang];
  const out: GeneratedFaq[] = [];
  const { paragraphs, signals, contact, description } = analysis;

  const aboutCtx = description || paragraphs[0] || '';
  if (aboutCtx) out.push({ q: t.about.q, a: t.about.a(aboutCtx) });

  if (signals.hasServices) {
    const ctx = findContext(paragraphs, /service|offer|სერვის|услуг|предлаг/i);
    if (ctx) out.push({ q: t.services.q, a: t.services.a(ctx) });
  }
  if (signals.hasPricing) {
    const ctx = findContext(paragraphs, /\$|€|₾|gel|price|cost|ფას|цен|стои/i);
    out.push({ q: t.pricing.q, a: t.pricing.a(ctx) });
  }
  if (signals.hasHours) {
    const ctx = findContext(paragraphs, /hours|open|monday|საათ|ღია|пн|часов/i);
    out.push({ q: t.hours.q, a: t.hours.a(ctx) });
  }
  if (signals.hasBooking) {
    const ctx = findContext(paragraphs, /book|reserv|appoint|ჯავშან|резерв/i);
    out.push({ q: t.booking.q, a: t.booking.a(ctx) });
  }
  if (signals.hasShipping) {
    const ctx = findContext(paragraphs, /ship|deliver|courier|მიწოდ|кур|доставк/i);
    out.push({ q: t.shipping.q, a: t.shipping.a(ctx) });
  }
  if (contact.addresses.length) {
    out.push({ q: t.location.q, a: t.location.a(contact.addresses.join(' · ')) });
  }
  if (contact.emails.length || contact.phones.length) {
    const parts = [
      contact.phones[0] && `📞 ${contact.phones[0]}`,
      contact.emails[0] && `✉️ ${contact.emails[0]}`,
    ].filter(Boolean) as string[];
    if (parts.length) out.push({ q: t.contact.q, a: t.contact.a(parts.join('  ·  ')) });
  }

  return out.filter(f => f.q && f.a).slice(0, 10);
}

// ─── Optional AI enhancement (Anthropic Claude) ─────────────────────────────

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

CONTENT:
${analysis.textSample.slice(0, 3500)}

Generate 6-10 natural customer questions (FAQ) in ${langName} with concise answers based ONLY on the content above.
Output strict JSON array only, no prose:
[{"q":"question","a":"answer"}]

Rules: questions should be short and natural; answers 1-3 sentences max; if information not available, give a polite "contact us" answer.`;

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
    return (JSON.parse(match[0]) as GeneratedFaq[]).filter(f => f.q && f.a).slice(0, 10);
  } catch {
    return null;
  }
}
