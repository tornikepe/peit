// GET  /api/unsubscribe?u=<uuid>&t=<category>&s=<sig>
// POST /api/unsubscribe?u=<uuid>&t=<category>&s=<sig>
//
// Public, no Clerk auth — authenticated by HMAC token in the query string.
// Supports both GET (link clicks) and POST (RFC 8058 one-click via the
// List-Unsubscribe-Post header that Gmail / Apple Mail honor). Idempotent:
// hitting it twice for the same category is a no-op.

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { DEFAULT_EMAIL_PREFS, type EmailPrefs } from '@/db/schema';
import { verifyUnsubToken } from '@/lib/email/unsubscribe';
import { normalizeLang, type EmailLang } from '@/lib/email/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESPONSE_COPY: Record<EmailLang, {
  pageTitle:   string;
  doneTitle:   (cat: string) => string;
  doneBody:    string;
  errorTitle:  string;
  errorBody:   string;
  manageLink:  string;
  homeLink:    string;
  category: { leadAlerts: string; productUpdates: string; trialReminders: string; all: string };
}> = {
  ka: {
    pageTitle:  'Email-ის ამოწერა — Peit',
    doneTitle:  c => `ამოწერა შესრულდა: ${c}`,
    doneBody:   'შენი არჩევანი შენახულია. შეგიძლია შეცვალო Email Preferences-ში ნებისმიერ დროს.',
    errorTitle: 'ბმული არასწორია ან ვადაგასულია',
    errorBody:  'ბმული შესაძლოა დაზიანდა — გადადი Email Preferences-ში ხელით.',
    manageLink: 'Email Preferences',
    homeLink:   'Peit-ში დაბრუნება',
    category: {
      leadAlerts:     'ლიდის შეტყობინებები',
      productUpdates: 'პროდუქტის სიახლეები',
      trialReminders: 'ტრიალის შეხსენებები',
      all:            'ყველა email',
    },
  },
  en: {
    pageTitle:  'Unsubscribe — Peit',
    doneTitle:  c => `Unsubscribed from: ${c}`,
    doneBody:   'Your preference is saved. You can change it anytime in Email Preferences.',
    errorTitle: 'Link invalid or expired',
    errorBody:  'This link may be malformed — manage your preferences directly instead.',
    manageLink: 'Email Preferences',
    homeLink:   'Back to Peit',
    category: {
      leadAlerts:     'Lead alerts',
      productUpdates: 'Product updates',
      trialReminders: 'Trial reminders',
      all:            'All emails',
    },
  },
  ru: {
    pageTitle:  'Отписка — Peit',
    doneTitle:  c => `Отписка выполнена: ${c}`,
    doneBody:   'Ваш выбор сохранён. Изменить можно в Email Preferences в любое время.',
    errorTitle: 'Ссылка неверна или истекла',
    errorBody:  'Ссылка возможно повреждена — управляйте настройками напрямую.',
    manageLink: 'Email Preferences',
    homeLink:   'Вернуться в Peit',
    category: {
      leadAlerts:     'Уведомления о лидах',
      productUpdates: 'Обновления продукта',
      trialReminders: 'Напоминания о триале',
      all:            'Все письма',
    },
  },
};

/** GET handler — also serves POST per RFC 8058. */
async function handle(req: Request): Promise<Response> {
  const url   = new URL(req.url);
  const token = verifyUnsubToken({
    u: url.searchParams.get('u'),
    t: url.searchParams.get('t'),
    s: url.searchParams.get('s'),
  });

  // Pick language: prefer ?lang= override, else fall back via Accept-Language.
  const langOverride = url.searchParams.get('lang');
  const acceptLang   = req.headers.get('accept-language')?.slice(0, 4) ?? '';
  const lang: EmailLang = normalizeLang(langOverride ?? acceptLang.split(/[-,]/)[0]);
  const t = RESPONSE_COPY[lang];

  if (!token) {
    return htmlResponse(buildErrorPage(t, lang), 400);
  }

  const db = getDb();
  if (!db) {
    return htmlResponse(buildErrorPage(t, lang), 503);
  }

  // Best-effort write. If the user row is gone (account deleted), treat
  // as success — the link did its job, there's nothing more to unsubscribe.
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, token.userId),
      columns: { id: true, emailPrefs: true },
    });
    if (user) {
      const current = user.emailPrefs ?? DEFAULT_EMAIL_PREFS;
      const next: EmailPrefs = token.type === 'all'
        ? { leadAlerts: false, productUpdates: false, trialReminders: false }
        : { ...current, [token.type]: false };

      await db.update(schema.users)
        .set({ emailPrefs: next, updatedAt: new Date() })
        .where(eq(schema.users.id, token.userId));
    }
  } catch (e) {
    console.error('[unsubscribe] db write failed:', e);
    return htmlResponse(buildErrorPage(t, lang), 500);
  }

  return htmlResponse(buildSuccessPage(t, token.type, lang), 200);
}

export async function GET(req: Request)  { return handle(req); }
export async function POST(req: Request) { return handle(req); }

// ─── HTML responses ───────────────────────────────────────────────────────
// Lightweight standalone pages — no Navbar/Footer so they render correctly
// even when JS is disabled (most webmail "open in browser" sandboxes do).

function htmlResponse(body: string, status: number): Response {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

const SHELL = (title: string, lang: EmailLang, body: string): string =>
  `<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<style>
:root{color-scheme:dark;}
*{box-sizing:border-box}
body{margin:0;background:#07070f;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.card{max-width:480px;width:100%;background:#0d0d1a;border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:36px 32px;box-shadow:0 24px 48px rgba(0,0,0,.32);}
.icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:24px;}
.icon.ok{background:rgba(16,185,129,.1);color:#10b981;border:1px solid rgba(16,185,129,.25);}
.icon.err{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.25);}
h1{margin:0 0 10px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#fff;}
p{margin:0 0 8px;font-size:14px;line-height:1.6;color:#9ca3af;}
.row{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;}
a.btn{display:inline-flex;align-items:center;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;transition:all .2s;}
a.btn.primary{background:#7c3aed;color:#fff;}
a.btn.primary:hover{background:#6d28d9;}
a.btn.ghost{background:rgba(255,255,255,.04);color:#d1d5db;border:1px solid rgba(255,255,255,.08);}
a.btn.ghost:hover{background:rgba(255,255,255,.08);}
</style>
</head><body>${body}</body></html>`;

function buildSuccessPage(t: typeof RESPONSE_COPY['ka'], category: keyof typeof RESPONSE_COPY['ka']['category'], lang: EmailLang): string {
  const catLabel = t.category[category];
  return SHELL(t.pageTitle, lang, `
<div class="card">
  <div class="icon ok">✓</div>
  <h1>${escape(t.doneTitle(catLabel))}</h1>
  <p>${escape(t.doneBody)}</p>
  <div class="row">
    <a class="btn primary" href="/dashboard/privacy">${escape(t.manageLink)}</a>
    <a class="btn ghost" href="/">${escape(t.homeLink)}</a>
  </div>
</div>`);
}

function buildErrorPage(t: typeof RESPONSE_COPY['ka'], lang: EmailLang): string {
  return SHELL(t.pageTitle, lang, `
<div class="card">
  <div class="icon err">!</div>
  <h1>${escape(t.errorTitle)}</h1>
  <p>${escape(t.errorBody)}</p>
  <div class="row">
    <a class="btn primary" href="/dashboard/privacy">${escape(t.manageLink)}</a>
    <a class="btn ghost" href="/">${escape(t.homeLink)}</a>
  </div>
</div>`);
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
