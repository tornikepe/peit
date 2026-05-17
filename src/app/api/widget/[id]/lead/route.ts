// POST /api/widget/[id]/lead — public, CORS-enabled.
//
// Body:
//   { name?, email?, phone?, message?, conversationId?,
//     gdprConsent: boolean,  // required
//     gdprText?:   string }  // raw consent label shown in widget, stored as audit
//
// Validates email + phone, scores the lead (cold/warm/hot), persists it,
// updates the bot's leads counter, and fires an owner-notification email
// (when RESEND_API_KEY is set — silent no-op otherwise).

import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';
import { scoreLead, isValidPhone, isValidEmail } from '@/lib/lead-score';
import { sendNewLeadEmail, isEmailAvailable } from '@/lib/email';

export const runtime = 'nodejs';

export async function OPTIONS() { return corsPreflight(); }

interface LeadBody {
  name?:           string;
  email?:          string;
  phone?:          string;
  message?:        string;
  conversationId?: string;
  gdprConsent?:    boolean;
  gdprText?:       string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const { id } = await params;
  if (!id) return corsError(400, 'MISSING_ID');

  // Rate limit: 5 leads / 10 min per IP — keeps spam down.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(rateLimitKey(['lead', ip]), 5, 600);
  if (!rl.allowed) return corsError(429, 'RATE_LIMITED');

  let body: LeadBody;
  try { body = await req.json(); }
  catch { return corsError(400, 'INVALID_JSON'); }

  // ── GDPR consent is mandatory ──────────────────────────────────────────
  if (body.gdprConsent !== true) {
    return corsError(400, 'GDPR_CONSENT_REQUIRED',
      'Lead can only be submitted with explicit GDPR consent.');
  }

  const name    = body.name?.trim()    || null;
  const email   = body.email?.trim()   || null;
  const phone   = body.phone?.trim()   || null;
  const message = body.message?.trim() || null;

  // ── Field validation ──────────────────────────────────────────────────
  if (!email && !phone) return corsError(400, 'EMAIL_OR_PHONE_REQUIRED');
  if (email && !isValidEmail(email)) {
    return corsError(400, 'INVALID_EMAIL');
  }
  if (phone && !isValidPhone(phone)) {
    return corsError(400, 'INVALID_PHONE');
  }

  // ── Resolve bot + owner ───────────────────────────────────────────────
  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    columns: { id: true, name: true, status: true, ownerId: true },
  });
  if (!bot)                    return corsError(404, 'BOT_NOT_FOUND');
  if (bot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');

  const owner = await db.query.users.findFirst({
    where: eq(schema.users.id, bot.ownerId),
    columns: { id: true, email: true, name: true, locale: true, emailPrefs: true },
  });

  // ── Score lead before insert ──────────────────────────────────────────
  const score = scoreLead({ email, phone, message });

  try {
    const [lead] = await db.insert(schema.leads).values({
      botId:          bot.id,
      conversationId: body.conversationId ?? null,
      name, email, phone, message,
      score,
      metadata: {
        gdprConsent: true,
        gdprAt:      new Date().toISOString(),
        gdprText:    body.gdprText ?? null,
        ip,                                          // for audit / abuse review
        userAgent:   req.headers.get('user-agent') ?? null,
      },
    }).returning({ id: schema.leads.id, createdAt: schema.leads.createdAt });

    await db.update(schema.bots)
      .set({
        statsCache: sql`jsonb_set(coalesce(${schema.bots.statsCache}, '{}'::jsonb),
                                   '{leads}',
                                   to_jsonb(coalesce((${schema.bots.statsCache}->>'leads')::int, 0) + 1))`,
      })
      .where(eq(schema.bots.id, bot.id));

    // Owner notification — fire-and-forget, never blocks the response.
    // Email module honors the owner's `leadAlerts` preference internally.
    if (owner?.email && isEmailAvailable()) {
      sendNewLeadEmail({
        to: {
          userId:     owner.id,
          email:      owner.email,
          name:       owner.name,
          locale:     owner.locale,
          emailPrefs: owner.emailPrefs,
        },
        botName: bot.name,
        botId:   bot.id,
        lead: {
          name, email, phone, message,
          score,
          createdAt: lead.createdAt,
        },
      }).catch(e => console.error('[widget/lead] email failed:', e));
    }

    return corsJson({ ok: true, leadId: lead.id, score });
  } catch (e) {
    console.error('[widget/lead] failed:', e);
    return corsError(500, 'INTERNAL', e instanceof Error ? e.message : undefined);
  }
}
