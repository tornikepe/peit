// Resend client — server-side only. Returns null when RESEND_API_KEY isn't
// configured so lead capture keeps working in dev / before the integration
// is set up.
//
// Env:
//   RESEND_API_KEY    — get at https://resend.com/api-keys
//   RESEND_FROM       — verified sender (e.g. "Peit <leads@peit.ge>"),
//                       falls back to onboarding@resend.dev for dev testing
//
// Usage:
//   await sendNewLeadEmail({ to, lead, bot });

export function isEmailAvailable(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function fromAddress(): string {
  return process.env.RESEND_FROM || 'Peit <onboarding@resend.dev>';
}

interface SendArgs {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
  replyTo?: string;
}

/** Low-level send. Fire-and-forget — logs but never throws into the caller. */
async function send({ to, subject, html, text, replyTo }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     fromAddress(),
        to:       [to],
        subject,
        html,
        text,
        reply_to: replyTo,
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

// ─── Templates ──────────────────────────────────────────────────────────

interface NewLeadParams {
  to:        string;             // bot owner's email
  botName:   string;
  botId:     string;
  appUrl:    string;
  lead: {
    name?:    string | null;
    email?:   string | null;
    phone?:   string | null;
    message?: string | null;
    score:    'cold' | 'warm' | 'hot';
    createdAt: Date;
  };
}

const SCORE_LABEL_KA = { cold: 'ცივი', warm: 'თბილი', hot: 'ცხელი' } as const;
const SCORE_COLOR    = { cold: '#9ca3af', warm: '#fbbf24', hot: '#ef4444' } as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Sends "you have a new lead" email to the bot owner. */
export async function sendNewLeadEmail(p: NewLeadParams): Promise<boolean> {
  const { to, botName, botId, appUrl, lead } = p;
  const scoreLabel = SCORE_LABEL_KA[lead.score];
  const scoreColor = SCORE_COLOR[lead.score];

  const safeName    = lead.name    ? escapeHtml(lead.name)    : '—';
  const safeEmail   = lead.email   ? escapeHtml(lead.email)   : '';
  const safePhone   = lead.phone   ? escapeHtml(lead.phone)   : '';
  const safeMessage = lead.message ? escapeHtml(lead.message) : '';
  const dashboardUrl = `${appUrl}/dashboard/leads`;

  const html = `<!DOCTYPE html><html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f7fb;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
    <div style="padding:24px 28px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;opacity:.85;">ახალი ლიდი · ${escapeHtml(botName)}</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;">გელოდება პასუხი</h1>
    </div>
    <div style="padding:24px 28px;">
      <div style="display:inline-block;padding:4px 12px;background:${scoreColor}22;color:${scoreColor};border-radius:999px;font-size:12px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px;">
        ${scoreLabel} ლიდი
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2937;">
        <tr><td style="padding:8px 0;color:#6b7280;width:90px;">სახელი</td><td style="padding:8px 0;font-weight:600;">${safeName}</td></tr>
        ${safeEmail ? `<tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#7c3aed;text-decoration:none;font-weight:600;">${safeEmail}</a></td></tr>` : ''}
        ${safePhone ? `<tr><td style="padding:8px 0;color:#6b7280;">ტელეფონი</td><td style="padding:8px 0;"><a href="tel:${safePhone}" style="color:#7c3aed;text-decoration:none;font-weight:600;">${safePhone}</a></td></tr>` : ''}
        ${safeMessage ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top;">შეტყობინება</td><td style="padding:8px 0;line-height:1.6;">${safeMessage}</td></tr>` : ''}
      </table>
      <a href="${dashboardUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">დაშბორდზე გადასვლა</a>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
        ლიდი მიღებულია ${lead.createdAt.toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })} (Tbilisi)<br/>
        ბოტი: ${escapeHtml(botName)} — <a href="${appUrl}/dashboard/bots/${botId}" style="color:#7c3aed;">ნახე ბოტი</a>
      </p>
    </div>
    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
      Peit — AI ჩატბოტი ქართული ბიზნესისთვის
    </div>
  </div>
</body></html>`;

  const text = [
    `ახალი ${scoreLabel} ლიდი — ${botName}`,
    '',
    `სახელი: ${lead.name ?? '—'}`,
    lead.email   ? `Email: ${lead.email}`   : null,
    lead.phone   ? `ტელეფონი: ${lead.phone}` : null,
    lead.message ? `\nშეტყობინება:\n${lead.message}` : null,
    '',
    `Dashboard: ${dashboardUrl}`,
  ].filter(Boolean).join('\n');

  return send({
    to,
    subject:  `[${botName}] ახალი ${scoreLabel} ლიდი — ${lead.name ?? lead.email ?? lead.phone ?? 'ანონიმური'}`,
    html,
    text,
    // So replying to the email reaches the lead directly when email present.
    replyTo: lead.email ?? undefined,
  });
}
