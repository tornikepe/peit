// Site analyzer — fetches a URL, extracts structured content, generates FAQs.
// Server-side only (uses fetch + cheerio). Phase 2.6: sitemap support,
// deeper crawl (up to 12 pages), prioritized link selection, smart chunking.

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
  sections: SiteSection[];
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
  /** Pages discovered via sitemap (vs HTML link discovery). */
  sitemapPages: number;
  textSample: string;
}

const PHONE_RE = /\+?\d[\d\s\-().]{7,}\d/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const MAX_PAGES         = 12;
const PER_PAGE_TIMEOUT  = 7_000;
const SITEMAP_TIMEOUT   = 6_000;

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
  url: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  sections: SiteSection[];
  links: { href: string; text: string }[];
  text: string;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PeitBot/1.0; +https://peit.ge/bot)',
        'Accept':     'text/html,application/xhtml+xml,application/xml',
      },
      signal:   controller.signal,
      redirect: 'follow',
    });
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

async function fetchPage(url: string, timeoutMs = PER_PAGE_TIMEOUT): Promise<ExtractedPage | null> {
  const res = await fetchWithTimeout(url, timeoutMs);
  if (!res || !res.ok) return null;
  if (!(res.headers.get('content-type') || '').includes('text/html')) return null;

  let html: string;
  try { html = await res.text(); } catch { return null; }
  if (!html) return null;

  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, nav, footer, header').remove();

  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').first().text().trim() || '';

  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() || '';

  // Walk DOM in order: when we hit a heading, start a new section.
  const sections: SiteSection[] = [];
  let currentHeading = title || 'General';
  let currentParas: string[] = [];

  if (description) sections.push({ heading: 'About', paragraphs: [description] });

  const mainContent = $('main, article, [role="main"], .content, #content, body').first();
  const container = mainContent.length ? mainContent : $('body');

  container.children().each((_, el) => {
    const tagName = (el as { tagName?: string }).tagName?.toLowerCase() ?? '';
    if (['h1', 'h2', 'h3'].includes(tagName)) {
      if (currentParas.length > 0) {
        sections.push({ heading: currentHeading, paragraphs: [...currentParas] });
      }
      currentHeading = $(el).text().trim().replace(/\s+/g, ' ');
      currentParas = [];
    } else if (['p', 'li', 'span', 'div'].includes(tagName)) {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text.length > 25 && text.length < 800) currentParas.push(text);
    } else if (['ul', 'ol'].includes(tagName)) {
      const items: string[] = [];
      $(el).find('li').each((_, li) => {
        const t = $(li).text().trim().replace(/\s+/g, ' ');
        if (t.length > 5) items.push('• ' + t);
      });
      if (items.length) currentParas.push(items.join('\n'));
    }
  });

  if (currentParas.length > 0) {
    sections.push({ heading: currentHeading, paragraphs: [...currentParas] });
  }

  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, ' ');
    if (t && t.length < 200) headings.push(t);
  });

  const paragraphs: string[] = [];
  $('p, li').each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, ' ');
    if (t.length > 20 && t.length < 600) paragraphs.push(t);
  });

  const links: { href: string; text: string }[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (href && text && text.length < 80) links.push({ href, text });
  });

  const text = [title, description, ...headings, ...paragraphs].join('\n');
  return { url, title, description, headings, paragraphs, sections, links, text };
}

// ─── Sitemap discovery ──────────────────────────────────────────────────────

async function fetchSitemap(baseUrl: string): Promise<string[]> {
  const base = new URL(baseUrl);
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];
  const seen = new Set<string>();
  const out: string[] = [];

  // Try robots.txt first — it sometimes points to the real sitemap.
  try {
    const r = await fetchWithTimeout(`${base.origin}/robots.txt`, 3000);
    if (r?.ok) {
      const txt = await r.text();
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*sitemap:\s*(\S+)/i);
        if (m && m[1]) candidates.unshift(m[1]);
      }
    }
  } catch { /* ignore */ }

  for (const candidate of candidates.slice(0, 4)) {
    let url: string;
    try {
      url = new URL(candidate, base).href;
    } catch { continue; }
    if (seen.has(url)) continue;
    seen.add(url);

    const res = await fetchWithTimeout(url, SITEMAP_TIMEOUT);
    if (!res?.ok) continue;
    const xml = await res.text();

    // Sitemap index?
    const indexMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!.trim());
    if (xml.includes('<sitemapindex')) {
      for (const sub of indexMatches.slice(0, 3)) {
        const subRes = await fetchWithTimeout(sub, SITEMAP_TIMEOUT);
        if (subRes?.ok) {
          const subXml = await subRes.text();
          for (const m of subXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
            out.push(m[1]!.trim());
          }
        }
      }
    } else {
      for (const m of indexMatches) out.push(m);
    }

    if (out.length > 0) break; // first working sitemap wins
  }

  // Same-host filter, dedupe
  const filtered = Array.from(new Set(
    out
      .map(u => { try { return new URL(u).href; } catch { return null; } })
      .filter((u): u is string => !!u && new URL(u).hostname === base.hostname),
  ));
  return filtered;
}

// ─── Link prioritization ────────────────────────────────────────────────────

const HIGH_VALUE_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /\b(about|company|story|ჩვენ-შესახებ|შესახებ)\b/i,                weight: 10 },
  { re: /\b(services?|offerings?|სერვის|შემოთავაზებ)\b/i,                  weight: 9 },
  { re: /\b(pricing|prices?|plans?|ფას|ღირებულ)\b/i,                       weight: 9 },
  { re: /\b(menu|products?|catalog|მენიუ|პროდუქტ|კატალოგ)\b/i,              weight: 8 },
  { re: /\b(rooms?|accommodation|ოთახ|სასტუმრო)\b/i,                       weight: 8 },
  { re: /\b(booking|reserve|appointment|ჯავშან|დაჯავშნ)\b/i,                weight: 7 },
  { re: /\b(faq|help|support|დახმარება|კითხვ)\b/i,                          weight: 7 },
  { re: /\b(contact|location|address|კონტაქტ|მისამართ)\b/i,                 weight: 6 },
  { re: /\b(blog|news|articles?|ბლოგ|სიახლე)\b/i,                            weight: 3 },
];

function scoreLink(href: string, text: string): number {
  let score = 0;
  const path = (() => { try { return new URL(href).pathname; } catch { return href; } })();
  const haystack = `${path} ${text}`.toLowerCase();
  for (const { re, weight } of HIGH_VALUE_PATTERNS) {
    if (re.test(haystack)) score += weight;
  }
  // Penalize deep paths (less likely to be useful main pages)
  const depth = path.split('/').filter(Boolean).length;
  if (depth > 3) score -= depth - 3;
  return score;
}

function pickInternalLinks(
  baseUrl: string,
  links: { href: string; text: string }[],
  limit: number,
): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>([base.href, base.href.replace(/\/$/, '')]);

  const candidates: { url: string; score: number }[] = [];

  for (const { href, text } of links) {
    let abs: string;
    try { abs = new URL(href, base).href.split('#')[0]!; } catch { continue; }
    const u = new URL(abs);
    if (u.hostname !== base.hostname) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);

    // Skip non-HTML asset paths
    if (/\.(png|jpe?g|webp|svg|gif|pdf|zip|doc|xls|css|js|mp4|mp3)(\?|$)/i.test(u.pathname)) continue;

    const score = scoreLink(abs, text);
    if (score > 0) candidates.push({ url: abs, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit).map(c => c.url);
}

// ─── Main analyzer ──────────────────────────────────────────────────────────

export async function analyzeSite(rawUrl: string): Promise<SiteAnalysis> {
  const url = normalizeUrl(rawUrl);

  const main = await fetchPage(url);
  if (!main) {
    throw new Error('ვებსაიტი ვერ წაიკითხა. შეამოწმე URL და ინტერნეტი.');
  }

  // ── Strategy 1: sitemap.xml (cheap, gives lots of URLs) ─────────────────
  const sitemapUrls = await fetchSitemap(url);
  let sitemapPages = 0;

  // ── Strategy 2: prioritized link discovery from main page ───────────────
  const linkUrls = pickInternalLinks(url, main.links, MAX_PAGES - 1);

  // Merge: prefer sitemap-discovered URLs that match our HIGH_VALUE_PATTERNS,
  // then top scoring links, then the rest of the sitemap.
  const merged: string[] = [];
  const seen = new Set<string>([url]);

  for (const u of sitemapUrls) {
    if (seen.has(u)) continue;
    if (scoreLink(u, '') >= 6) {
      merged.push(u);
      seen.add(u);
    }
    if (merged.length >= MAX_PAGES - 1) break;
  }

  for (const u of linkUrls) {
    if (merged.length >= MAX_PAGES - 1) break;
    if (seen.has(u)) continue;
    merged.push(u);
    seen.add(u);
  }

  for (const u of sitemapUrls) {
    if (merged.length >= MAX_PAGES - 1) break;
    if (seen.has(u)) continue;
    merged.push(u);
    seen.add(u);
  }

  // ── Crawl all picked URLs in parallel (with a global timeout) ───────────
  const subPages = await Promise.all(merged.map(u => fetchPage(u)));
  sitemapPages = subPages.filter((_, i) => sitemapUrls.includes(merged[i]!)).filter(Boolean).length;

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

  const uniqueHeadings = Array.from(new Set(allHeadings)).slice(0, 50);
  const uniqueParagraphs = Array.from(new Set(allParagraphs)).slice(0, 120);

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
    sitemapPages,
    textSample: allText.slice(0, 6000),
  };
}

// ─── Knowledge chunks (smart paragraph-level chunking) ──────────────────────

const TARGET_CHUNK_CHARS = 700;
const CHUNK_OVERLAP_CHARS = 100;
const MIN_CHUNK_CHARS     = 80;
const MAX_CHUNKS          = 80;

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

/**
 * Split a long text into ~700-char chunks with ~100-char overlap so that
 * sentences crossing chunk boundaries still match semantically.
 */
function splitIntoSizedChunks(heading: string, body: string): { heading: string; content: string }[] {
  const out: { heading: string; content: string }[] = [];
  if (body.length <= TARGET_CHUNK_CHARS) {
    if (body.length >= MIN_CHUNK_CHARS) out.push({ heading, content: body });
    return out;
  }

  // Prefer breaking at paragraph boundaries (\n\n), then sentence boundaries.
  const paragraphs = body.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  let buffer = '';
  let part = 1;
  for (const p of paragraphs) {
    if ((buffer + '\n' + p).length > TARGET_CHUNK_CHARS && buffer.length >= MIN_CHUNK_CHARS) {
      out.push({
        heading: out.length === 0 ? heading : `${heading} (cont. ${part++})`,
        content: buffer.trim(),
      });
      // overlap: keep the last sentence(s) of the previous buffer
      const tailSentences = buffer.split(/(?<=[.!?…])\s+/).slice(-2).join(' ');
      buffer = (tailSentences.length < CHUNK_OVERLAP_CHARS ? tailSentences : '') + '\n' + p;
    } else {
      buffer = buffer ? buffer + '\n' + p : p;
    }
  }
  if (buffer.trim().length >= MIN_CHUNK_CHARS) {
    out.push({
      heading: out.length === 0 ? heading : `${heading} (cont. ${part})`,
      content: buffer.trim(),
    });
  }

  return out;
}

export function buildKnowledgeChunks(analysis: SiteAnalysis): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const seenSig = new Set<string>();

  function pushChunk(heading: string, content: string) {
    const sig = (heading + content).slice(0, 120);
    if (seenSig.has(sig)) return;
    if (content.length < MIN_CHUNK_CHARS) return;
    seenSig.add(sig);
    chunks.push({
      id: 'ck_' + Math.random().toString(36).slice(2, 10),
      heading,
      content,
      keywords: extractKeywords(heading + ' ' + content),
    });
  }

  // 1. Structured sections — split big ones into smaller chunks
  for (const section of analysis.sections) {
    if (chunks.length >= MAX_CHUNKS) break;
    if (!section.paragraphs.length) continue;
    const body = section.paragraphs.filter(p => p.length > 20).join('\n\n');
    const sized = splitIntoSizedChunks(section.heading, body);
    for (const c of sized) {
      if (chunks.length >= MAX_CHUNKS) break;
      pushChunk(c.heading, c.content);
    }
  }

  // 2. Topic-bucket fallback if structured sections were sparse
  if (chunks.length < 5) {
    const buckets: Record<string, string[]> = {
      Pricing: [], Hours: [], Contact: [], Services: [], General: [],
    };
    for (const p of analysis.paragraphs) {
      if (/ფას|price|cost|₾|\$|€/i.test(p))           buckets.Pricing.push(p);
      else if (/საათ|hour|open|monday|ორშ/i.test(p))   buckets.Hours.push(p);
      else if (/კონტაქტ|contact|phone|email/i.test(p)) buckets.Contact.push(p);
      else if (/სერვის|service|offer/i.test(p))        buckets.Services.push(p);
      else                                              buckets.General.push(p);
    }
    for (const [heading, paras] of Object.entries(buckets)) {
      if (!paras.length || chunks.length >= MAX_CHUNKS) continue;
      const body = paras.join('\n\n');
      for (const c of splitIntoSizedChunks(heading, body)) {
        if (chunks.length >= MAX_CHUNKS) break;
        pushChunk(c.heading, c.content);
      }
    }
  }

  // 3. Contact info (always keep — short and high-value)
  const { emails, phones, addresses } = analysis.contact;
  if (emails.length || phones.length || addresses.length) {
    const parts = [
      phones[0] && `📞 ${phones[0]}`,
      emails[0] && `✉️ ${emails[0]}`,
      addresses[0] && `📍 ${addresses[0]}`,
    ].filter(Boolean).join('\n');
    if (parts) {
      chunks.push({
        id: 'ck_' + Math.random().toString(36).slice(2, 10),
        heading: 'Contact Information',
        content: parts,
        keywords: ['contact', 'phone', 'email', 'address', 'კონტაქტი', 'ტელეფონი', 'მისამართი'],
      });
    }
  }

  return chunks.slice(0, MAX_CHUNKS);
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
${analysis.textSample.slice(0, 4000)}

Generate 6-10 natural customer questions (FAQ) in ${langName} with concise answers based ONLY on the content above.
Output strict JSON array only, no prose:
[{"q":"question","a":"answer"}]

Rules: questions short and natural; answers 1-3 sentences max; if information not available, give a polite "contact us" answer.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
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
