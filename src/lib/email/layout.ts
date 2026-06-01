// Shared HTML wrapper for transactional emails.
//
// Designed to render correctly across Gmail (web + iOS + Android), Apple Mail,
// Outlook web/desktop, Yandex Mail. That means:
//   - Inline styles only (no <style> blocks — they get stripped in some clients)
//   - Tables for structural layout where padding matters
//   - max-width on the outer container, never the body
//   - Fonts: system fallback stack only (no @font-face loads)
//
// The wrapper provides:
//   - Branded header with logo
//   - Preheader (preview text shown next to subject in inbox)
//   - Footer with copyright, unsubscribe link, preferences link

import { escapeHtml } from './send';
import { layoutCopy, type EmailLang } from './i18n';

export interface LayoutOptions {
  /** Page title — usually mirrors the subject. */
  title:       string;
  /** Short preview text (≤90 chars). Hidden from rendered body but shown
   *  next to the subject in inbox listings. */
  preheader?:  string;
  /** HTML body content (already escaped where needed). */
  content:     string;
  /** UI language. */
  lang:        EmailLang;
  /** Where the unsubscribe / preferences link should go. */
  unsubscribeUrl?: string;
  /** Where the "manage preferences" link should go (dashboard). */
  preferencesUrl?: string;
  /** App URL for the brand link in the header. */
  appUrl:      string;
}

const BRAND      = '#14b8a6';
const BRAND_DARK = '#0f766e';

export function renderLayout(opts: LayoutOptions): string {
  const t = layoutCopy[opts.lang];
  const safeTitle = escapeHtml(opts.title);
  const safePreheader = opts.preheader ? escapeHtml(opts.preheader) : '';

  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;-webkit-text-size-adjust:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">

${safePreheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${safePreheader}</div>` : ''}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f7;padding:32px 16px;">
  <tr>
    <td align="center">

      <!-- Header -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
        <tr>
          <td style="padding:0 0 20px 4px;">
            <a href="${escapeHtml(opts.appUrl)}" style="text-decoration:none;display:inline-block;">
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:24px;letter-spacing:-0.04em;color:#0d0d1a;">
                pe<span style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});-webkit-background-clip:text;background-clip:text;color:transparent;">i</span>t
              </span>
            </a>
          </td>
        </tr>
      </table>

      <!-- Body card -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr>
          <td style="padding:36px 32px 32px;">
            ${opts.content}
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
        <tr>
          <td style="padding:24px 8px 0;font-size:11px;color:#9ca3af;line-height:1.6;text-align:center;">
            <p style="margin:0 0 6px;">${escapeHtml(t.poweredBy)}</p>
            <p style="margin:0 0 12px;">${escapeHtml(t.footerTagline)}</p>
            <p style="margin:0;">
              ${opts.unsubscribeUrl ? `<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#9ca3af;text-decoration:underline;">${escapeHtml(t.unsubscribe)}</a>` : ''}
              ${opts.unsubscribeUrl && opts.preferencesUrl ? '<span style="margin:0 6px;color:#d1d5db;">·</span>' : ''}
              ${opts.preferencesUrl ? `<a href="${escapeHtml(opts.preferencesUrl)}" style="color:#9ca3af;text-decoration:underline;">${escapeHtml(t.preferencesLink)}</a>` : ''}
            </p>
            <p style="margin:12px 0 0;">${escapeHtml(t.copyright)}</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── Reusable building blocks for template content ─────────────────────────

/** Big violet CTA button. Renders as a link styled as a button. */
export function renderCta(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
  <tr>
    <td style="border-radius:10px;background:${BRAND};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

/** Caption-style text shown directly under a CTA. */
export function renderCtaSub(text: string): string {
  return `<p style="margin:0 0 24px;font-size:12px;color:#9ca3af;">${escapeHtml(text)}</p>`;
}

/** Section heading (h2 inside the card). */
export function renderHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0d0d1a;letter-spacing:-0.02em;">${escapeHtml(text)}</h1>`;
}

/** Body paragraph. */
export function renderP(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(text)}</p>`;
}

/** Bullet list with violet markers. */
export function renderUl(items: string[]): string {
  const lis = items.map(i => `
  <tr>
    <td style="padding:6px 0 6px 4px;vertical-align:top;width:18px;">
      <div style="width:6px;height:6px;border-radius:50%;background:${BRAND};margin-top:8px;"></div>
    </td>
    <td style="padding:6px 0 6px 8px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(i)}</td>
  </tr>`).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">${lis}</table>`;
}

/** Numbered list. */
export function renderOl(items: string[]): string {
  const lis = items.map((it, idx) => `
  <tr>
    <td style="padding:8px 0 8px 4px;vertical-align:top;width:26px;">
      <div style="width:22px;height:22px;border-radius:50%;background:${BRAND}15;color:${BRAND_DARK};font-size:11px;font-weight:700;text-align:center;line-height:22px;">${idx + 1}</div>
    </td>
    <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(it)}</td>
  </tr>`).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;width:100%;">${lis}</table>`;
}

/** Subtle helper line at the bottom of an email. */
export function renderHelp(text: string): string {
  return `<p style="margin:24px 0 0;padding-top:18px;border-top:1px solid #f1f5f9;font-size:12px;color:#9ca3af;line-height:1.6;">${escapeHtml(text)}</p>`;
}

/** Sign-off line, preserves \n as <br>. */
export function renderSignOff(text: string): string {
  return `<p style="margin:24px 0 0;font-size:14px;color:#374151;line-height:1.6;">${text.split('\n').map(escapeHtml).join('<br/>')}</p>`;
}

/** Status badge (cold / warm / hot lead, etc.). Returns colored pill. */
export function renderBadge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;background:${color}22;color:${color};border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(text)}</span>`;
}

/** Key/value detail row (used in lead summary, billing receipt). */
export function renderDetail(label: string, value: string, opts?: { href?: string }): string {
  const valueHtml = opts?.href
    ? `<a href="${escapeHtml(opts.href)}" style="color:${BRAND};text-decoration:none;font-weight:600;">${escapeHtml(value)}</a>`
    : `<span style="font-weight:600;color:#0d0d1a;">${escapeHtml(value)}</span>`;
  return `<tr>
    <td style="padding:8px 12px 8px 0;font-size:13px;color:#6b7280;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:#0d0d1a;">${valueHtml}</td>
  </tr>`;
}

/** Wrap detail rows in a table. */
export function renderDetails(rows: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0 4px;border-collapse:collapse;">${rows}</table>`;
}
