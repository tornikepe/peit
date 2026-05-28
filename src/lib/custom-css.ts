// Server-side sanitizer for owner-authored widget CSS (Feature #10).
//
// The widget injects this string verbatim inside a <style> tag, so we treat
// it as untrusted and strip the constructs that turn CSS into an attack
// surface:
//
//  - `@import` — would let the owner pull arbitrary remote stylesheets,
//    potentially leaking visitor referer headers to third parties.
//  - `url(...)` — fetches external resources (images, fonts) that could
//    fingerprint visitors or smuggle data.
//  - `expression(...)` — legacy IE JS-in-CSS escape hatch.
//  - HTML-context breakouts (`</style>`, `<script`) — stop the owner from
//    closing the style block and injecting markup.
//
// We also clamp the total length so a misuse can't bloat the config payload.

const MAX_CSS_BYTES = 8192;

export function sanitizeCustomCss(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let css = raw.slice(0, MAX_CSS_BYTES);

  // Kill dangerous constructs. We replace with an empty string rather than
  // rejecting outright so a typo in one rule doesn't blow away the whole
  // stylesheet — the user keeps the rest of their work.
  css = css.replace(/@import\b[^;]*;?/gi, '');
  css = css.replace(/url\s*\([^)]*\)/gi, '');
  css = css.replace(/expression\s*\([^)]*\)/gi, '');

  // Defense in depth against breakout characters. None of these are valid
  // inside a CSS declaration anyway.
  css = css.replace(/<\/?\s*style[^>]*>/gi, '');
  css = css.replace(/<\s*script[^>]*>/gi, '');

  return css.trim();
}
