// Public email API. Every send* function:
//   - Picks language from recipient.locale (falls back to KA)
//   - Honors the recipient's per-category EmailPrefs when the email is
//     marketing / advisory rather than strictly transactional
//   - Adds an HMAC unsubscribe URL + List-Unsubscribe headers
//   - Never throws — returns true on send, false on failure / opt-out / no key
//
// Templates live below as `build*()` pure functions returning { subject, html,
// text }. The send* functions are thin shells that wire those into send().

import type { EmailPrefs } from '@/db/schema';
import { DEFAULT_EMAIL_PREFS } from '@/db/schema';
import { appBaseUrl, escapeHtml, isEmailAvailable, send } from './send';
import {
  layoutCopy, leadCopy, normalizeLang, subCopy, trialEndedCopy, trialEndingCopy, welcomeCopy,
  type EmailLang,
} from './i18n';
import {
  renderBadge, renderCta, renderCtaSub, renderDetail, renderDetails,
  renderHeading, renderHelp, renderLayout, renderOl, renderP, renderSignOff,
} from './layout';
import { unsubscribeUrl, type UnsubCategory } from './unsubscribe';

export { isEmailAvailable } from './send';

// ─── Recipient & preference helpers ────────────────────────────────────────

/** Everything we need to know about who the email is going to. */
export interface Recipient {
  userId:     string;
  email:      string;
  name:       string | null;
  locale:     string | null;
  emailPrefs: EmailPrefs | null;
}

/** Localised date formatter that handles all three supported languages. */
function formatDate(date: Date, lang: EmailLang): string {
  const locale = lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Localised date+time, Tbilisi timezone. */
function formatDateTime(date: Date, lang: EmailLang): string {
  const locale = lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US';
  return date.toLocaleString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Tbilisi',
  });
}

/** Resolve effective prefs (DB value or defaults). */
function resolvePrefs(r: { emailPrefs: EmailPrefs | null }): EmailPrefs {
  return r.emailPrefs ?? DEFAULT_EMAIL_PREFS;
}

/** Common per-recipient stamping for an outbound mail. */
function recipientCtx(r: Recipient): {
  lang: EmailLang;
  appUrl: string;
  prefsUrl: string;
  unsub: (type: UnsubCategory) => string;
} {
  const lang   = normalizeLang(r.locale);
  const appUrl = appBaseUrl();
  return {
    lang,
    appUrl,
    prefsUrl: `${appUrl}/dashboard/privacy`,
    unsub:    type => unsubscribeUrl(r.userId, type),
  };
}

// ─── Welcome ───────────────────────────────────────────────────────────────

interface SendWelcomeArgs {
  to: Recipient;
}

/** Welcome new users. Transactional → does NOT check productUpdates. */
export async function sendWelcomeEmail({ to }: SendWelcomeArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;
  const { lang, appUrl, prefsUrl, unsub } = recipientCtx(to);
  const t = welcomeCopy[lang];
  const newBotUrl    = `${appUrl}/dashboard/bots/new`;

  const content = [
    renderHeading(t.heading),
    renderP(t.greeting(to.name ?? '')),
    renderP(t.intro),
    renderOl(t.steps),
    renderCta(newBotUrl, t.cta),
    renderHelp(t.helpText),
    renderSignOff(t.signOff),
  ].join('\n');

  const html = renderLayout({
    title:           t.subject,
    preheader:       t.preheader,
    content,
    lang,
    appUrl,
    preferencesUrl:  prefsUrl,
    unsubscribeUrl:  unsub('productUpdates'),
  });

  const text = [
    t.greeting(to.name ?? ''),
    '',
    t.intro,
    '',
    ...t.steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    `${t.cta}: ${newBotUrl}`,
    '',
    t.helpText,
    '',
    t.signOff,
  ].join('\n');

  return send({
    to:             to.email,
    subject:        t.subject,
    html,
    text,
    unsubscribeUrl: unsub('productUpdates'),
    tags:           [{ name: 'email_type', value: 'welcome' }],
  });
}

// ─── Lead notification ─────────────────────────────────────────────────────

interface SendLeadArgs {
  to:       Recipient;
  botName:  string;
  botId:    string;
  lead: {
    name?:    string | null;
    email?:   string | null;
    phone?:   string | null;
    message?: string | null;
    score:    'cold' | 'warm' | 'hot';
    createdAt: Date;
  };
}

const LEAD_SCORE_COLOR: Record<'cold' | 'warm' | 'hot', string> = {
  cold: '#9ca3af', warm: '#f59e0b', hot: '#ef4444',
};

/** "You have a new lead" email. Opt-out via leadAlerts pref. */
export async function sendNewLeadEmail({ to, botName, botId, lead }: SendLeadArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;
  if (!resolvePrefs(to).leadAlerts) return false; // user opted out

  const { lang, appUrl, prefsUrl, unsub } = recipientCtx(to);
  const t = leadCopy[lang];
  const scoreLabel = t.scoreLabel[lead.score];
  const scoreColor = LEAD_SCORE_COLOR[lead.score];
  const dashboardUrl = `${appUrl}/dashboard/leads`;
  const botUrl       = `${appUrl}/dashboard/bots/${botId}`;

  const detailRows = [
    renderDetail(t.fields.name, lead.name?.trim() || '—'),
    lead.email ? renderDetail(t.fields.email, lead.email, { href: `mailto:${lead.email}` }) : '',
    lead.phone ? renderDetail(t.fields.phone, lead.phone, { href: `tel:${lead.phone}` })   : '',
    lead.message ? renderDetail(t.fields.message, lead.message) : '',
  ].filter(Boolean).join('');

  const content = [
    `<div style="margin-bottom:14px;">${renderBadge(t.badge(scoreLabel), scoreColor)}</div>`,
    renderHeading(t.heading),
    renderDetails(detailRows),
    renderCta(dashboardUrl, t.cta),
    `<p style="margin:18px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
      ${escapeHtml(t.metaSeenAt(formatDateTime(lead.createdAt, lang)))}<br/>
      ${escapeHtml(t.metaBot(botName))} — <a href="${escapeHtml(botUrl)}" style="color:#7c3aed;text-decoration:none;">${escapeHtml(t.viewBot)}</a>
    </p>`,
  ].join('\n');

  const html = renderLayout({
    title:          t.subjectFn({ score: scoreLabel, lead: lead.name ?? lead.email ?? lead.phone ?? '—', botName }),
    preheader:      t.preheader(scoreLabel),
    content,
    lang,
    appUrl,
    preferencesUrl: prefsUrl,
    unsubscribeUrl: unsub('leadAlerts'),
  });

  const text = [
    `${t.badge(scoreLabel)} — ${botName}`,
    '',
    `${t.fields.name}: ${lead.name ?? '—'}`,
    lead.email   ? `${t.fields.email}: ${lead.email}`   : null,
    lead.phone   ? `${t.fields.phone}: ${lead.phone}`   : null,
    lead.message ? `\n${t.fields.message}:\n${lead.message}` : null,
    '',
    `Dashboard: ${dashboardUrl}`,
  ].filter(Boolean).join('\n');

  const subjectLeadName = lead.name?.trim()
    || lead.email
    || lead.phone
    || (lang === 'ka' ? 'ანონიმური' : lang === 'ru' ? 'аноним' : 'anonymous');

  return send({
    to:             to.email,
    subject:        t.subjectFn({ score: scoreLabel, lead: subjectLeadName, botName }),
    html,
    text,
    unsubscribeUrl: unsub('leadAlerts'),
    replyTo:        lead.email ?? undefined,
    tags:           [{ name: 'email_type', value: 'lead_alert' }, { name: 'lead_score', value: lead.score }],
  });
}

// ─── Trial ending ──────────────────────────────────────────────────────────

interface SendTrialEndingArgs {
  to:        Recipient;
  daysLeft:  number;
}

export async function sendTrialEndingEmail({ to, daysLeft }: SendTrialEndingArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;
  if (!resolvePrefs(to).trialReminders) return false;

  const { lang, appUrl, prefsUrl, unsub } = recipientCtx(to);
  const t = trialEndingCopy[lang];
  const pricingUrl = `${appUrl}/pricing`;

  const content = [
    renderHeading(t.heading(daysLeft)),
    renderP(t.greeting(to.name ?? '')),
    renderP(t.body(daysLeft)),
    renderOl(t.bullets),
    renderCta(pricingUrl, t.cta),
    renderCtaSub(t.ctaSub),
    renderHelp(t.helpText),
  ].join('\n');

  const html = renderLayout({
    title:          t.subject(daysLeft),
    preheader:      t.preheader(daysLeft),
    content,
    lang,
    appUrl,
    preferencesUrl: prefsUrl,
    unsubscribeUrl: unsub('trialReminders'),
  });

  const text = [
    t.heading(daysLeft),
    '',
    t.greeting(to.name ?? ''),
    '',
    t.body(daysLeft),
    '',
    ...t.bullets.map(b => `• ${b}`),
    '',
    `${t.cta}: ${pricingUrl}`,
    '',
    t.helpText,
  ].join('\n');

  return send({
    to:             to.email,
    subject:        t.subject(daysLeft),
    html,
    text,
    unsubscribeUrl: unsub('trialReminders'),
    tags:           [{ name: 'email_type', value: 'trial_ending' }, { name: 'days_left', value: String(daysLeft) }],
  });
}

// ─── Trial ended ───────────────────────────────────────────────────────────

interface SendTrialEndedArgs {
  to: Recipient;
}

export async function sendTrialEndedEmail({ to }: SendTrialEndedArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;
  if (!resolvePrefs(to).trialReminders) return false;

  const { lang, appUrl, prefsUrl, unsub } = recipientCtx(to);
  const t = trialEndedCopy[lang];
  const pricingUrl = `${appUrl}/pricing`;

  const content = [
    renderHeading(t.heading),
    renderP(t.greeting(to.name ?? '')),
    renderP(t.body),
    renderP(t.bodyImpact),
    renderCta(pricingUrl, t.cta),
    renderCtaSub(t.ctaSub),
    renderHelp(t.helpText),
  ].join('\n');

  const html = renderLayout({
    title:          t.subject,
    preheader:      t.preheader,
    content,
    lang,
    appUrl,
    preferencesUrl: prefsUrl,
    unsubscribeUrl: unsub('trialReminders'),
  });

  const text = [
    t.heading,
    '',
    t.greeting(to.name ?? ''),
    '',
    t.body,
    '',
    t.bodyImpact,
    '',
    `${t.cta}: ${pricingUrl}`,
    '',
    t.helpText,
  ].join('\n');

  return send({
    to:             to.email,
    subject:        t.subject,
    html,
    text,
    unsubscribeUrl: unsub('trialReminders'),
    tags:           [{ name: 'email_type', value: 'trial_ended' }],
  });
}

// ─── Subscription receipt ──────────────────────────────────────────────────

interface SendSubReceiptArgs {
  to:           Recipient;
  plan:         string;
  status:       string;
  nextBilling:  Date | null;
}

export async function sendSubscriptionReceiptEmail(args: SendSubReceiptArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;
  // Billing receipts are transactional — no opt-out.

  const { to, plan, status, nextBilling } = args;
  const { lang, appUrl, prefsUrl } = recipientCtx(to);
  const t = subCopy[lang].receipt;
  const dashboardUrl = `${appUrl}/dashboard/billing`;
  const layout = layoutCopy[lang];

  const billingDate = nextBilling ? formatDate(nextBilling, lang) : '—';

  const detailRows = [
    renderDetail(t.fields.plan,        plan),
    renderDetail(t.fields.status,      status),
    renderDetail(t.fields.nextBilling, billingDate),
  ].join('');

  const content = [
    renderHeading(t.heading),
    renderP(t.greeting(to.name ?? '')),
    renderP(t.body(plan, billingDate)),
    `<p style="margin:8px 0 4px;font-size:13px;color:#6b7280;font-weight:600;">${escapeHtml(t.summary)}</p>`,
    renderDetails(detailRows),
    renderCta(dashboardUrl, t.cta),
    renderHelp(t.helpText),
  ].join('\n');

  const html = renderLayout({
    title:          t.subject(plan),
    preheader:      t.preheader,
    content,
    lang,
    appUrl,
    preferencesUrl: prefsUrl,
    // No unsubscribe — this is transactional.
  });

  const text = [
    t.heading,
    '',
    t.greeting(to.name ?? ''),
    '',
    t.body(plan, billingDate),
    '',
    `${t.fields.plan}: ${plan}`,
    `${t.fields.status}: ${status}`,
    `${t.fields.nextBilling}: ${billingDate}`,
    '',
    `${t.cta}: ${dashboardUrl}`,
    '',
    t.helpText,
    '',
    layout.copyright,
  ].join('\n');

  return send({
    to:      to.email,
    subject: t.subject(plan),
    html,
    text,
    tags:    [{ name: 'email_type', value: 'subscription_receipt' }, { name: 'plan', value: plan }],
  });
}

// ─── Subscription cancelled ────────────────────────────────────────────────

interface SendSubCancelledArgs {
  to:        Recipient;
  endsAt:    Date | null;
}

export async function sendSubscriptionCancelledEmail(args: SendSubCancelledArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;

  const { to, endsAt } = args;
  const { lang, appUrl, prefsUrl } = recipientCtx(to);
  const t = subCopy[lang].cancelled;
  const billingUrl = `${appUrl}/dashboard/billing`;
  const endsLabel  = endsAt ? formatDate(endsAt, lang) : '—';

  const content = [
    renderHeading(t.heading),
    renderP(t.greeting(to.name ?? '')),
    renderP(t.body(endsLabel)),
    renderCta(billingUrl, t.cta),
    renderHelp(t.helpText),
  ].join('\n');

  const html = renderLayout({
    title:          t.subject,
    preheader:      t.preheader(endsLabel),
    content,
    lang,
    appUrl,
    preferencesUrl: prefsUrl,
  });

  const text = [
    t.heading,
    '',
    t.greeting(to.name ?? ''),
    '',
    t.body(endsLabel),
    '',
    `${t.cta}: ${billingUrl}`,
    '',
    t.helpText,
  ].join('\n');

  return send({
    to:      to.email,
    subject: t.subject,
    html,
    text,
    tags:    [{ name: 'email_type', value: 'subscription_cancelled' }],
  });
}

// ─── Payment failed ────────────────────────────────────────────────────────

interface SendPaymentFailedArgs {
  to: Recipient;
}

export async function sendPaymentFailedEmail({ to }: SendPaymentFailedArgs): Promise<boolean> {
  if (!isEmailAvailable()) return false;

  const { lang, appUrl, prefsUrl } = recipientCtx(to);
  const t = subCopy[lang].paymentFailed;
  const billingUrl = `${appUrl}/dashboard/billing`;

  const content = [
    renderHeading(t.heading),
    renderP(t.greeting(to.name ?? '')),
    renderP(t.body),
    renderCta(billingUrl, t.cta),
    renderHelp(t.helpText),
  ].join('\n');

  const html = renderLayout({
    title:          t.subject,
    preheader:      t.preheader,
    content,
    lang,
    appUrl,
    preferencesUrl: prefsUrl,
  });

  const text = [
    t.heading,
    '',
    t.greeting(to.name ?? ''),
    '',
    t.body,
    '',
    `${t.cta}: ${billingUrl}`,
    '',
    t.helpText,
  ].join('\n');

  return send({
    to:      to.email,
    subject: t.subject,
    html,
    text,
    tags:    [{ name: 'email_type', value: 'payment_failed' }],
  });
}
