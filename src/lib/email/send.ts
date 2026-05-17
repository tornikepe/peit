// Resend client — server-side only. Returns false on any failure
// (missing key, HTTP error, network exception) so callers can fire-and-forget
// without breaking the surrounding flow.
//
// Env:
//   RESEND_API_KEY    — get at https://resend.com/api-keys
//   RESEND_FROM       — verified sender, e.g. "Peit Team <hi@peit.ge>".
//                       Falls back to "Peit Team <onboarding@resend.dev>" for
//                       dev testing. The display name shown in the inbox is
//                       ALWAYS "Peit Team" — never the Resend default account
//                       name (which would show up as "MyApplication" or
//                       whatever was set in the Resend dashboard).
//   NEXT_PUBLIC_APP_URL — base URL for dashboard / unsubscribe links.

export function isEmailAvailable(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Normalise the From header so the inbox always shows "Peit Team" as the
 * sender, regardless of what env var was provided.
 *
 *   RESEND_FROM="legal@peit.ge"             → "Peit Team <legal@peit.ge>"
 *   RESEND_FROM="Foo <legal@peit.ge>"       → "Peit Team <legal@peit.ge>"
 *   RESEND_FROM unset                       → "Peit Team <onboarding@resend.dev>"
 */
export function fromAddress(): string {
  const DISPLAY = 'Peit Team';
  const raw     = process.env.RESEND_FROM?.trim();
  if (!raw) return `${DISPLAY} <onboarding@resend.dev>`;

  // If the env var already has the angle-bracket form, strip the existing
  // display name and apply ours. Otherwise treat the value as a bare address.
  const m = raw.match(/^[^<]*<([^>]+)>\s*$/);
  const addr = m ? m[1].trim() : raw;
  return `${DISPLAY} <${addr}>`;
}

export function appBaseUrl(): string {
  // Strip trailing slash to keep concatenation predictable.
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://peit.ge').replace(/\/$/, '');
}

export interface SendArgs {
  to:       string;
  subject:  string;
  html:     string;
  text:     string;
  replyTo?: string;
  /** RFC-8058 one-click unsubscribe target. Adds standard List-Unsubscribe
   *  headers so Gmail / Apple Mail render an "Unsubscribe" link. */
  unsubscribeUrl?: string;
  /** Resend "tags" for filtering in dashboard / analytics. */
  tags?: { name: string; value: string }[];
}

/** Escape HTML for safe insertion into templates. Re-exported so all
 *  template files use the same one. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Low-level send. Fire-and-forget — logs but never throws into the caller.
 * Returns true on 2xx from Resend, false on anything else.
 */
export async function send(args: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const headers: Record<string, string> = {};
  if (args.unsubscribeUrl) {
    // RFC 8058 — Gmail / Apple Mail recognise these and render a one-click
    // "Unsubscribe" link at the top of the message.
    headers['List-Unsubscribe']      = `<${args.unsubscribeUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    fromAddress(),
        to:      [args.to],
        subject: args.subject,
        html:    args.html,
        text:    args.text,
        reply_to: args.replyTo,
        headers: Object.keys(headers).length ? headers : undefined,
        tags:    args.tags,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[email] resend failed', res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] resend exception', e);
    return false;
  }
}
