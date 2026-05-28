// GET /api/widget/[id]/config — public, CORS-enabled.
// Origin allowlist is enforced here so the widget refuses to render
// on non-whitelisted host pages.

import { eq, asc, and } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { CORS_HEADERS, corsPreflight, corsJson, corsError } from '@/lib/widget-cors';
import { isOriginAllowed } from '@/lib/origin-check';
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function OPTIONS() { return corsPreflight(); }

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const { id } = await params;
  if (!id) return corsError(400, 'MISSING_ID');

  // Soft rate limit on config (in case someone scrapes)
  const ip = getClientIp(req);
  const rl = await checkRateLimit(rateLimitKey(['cfg', ip]), 120, 60); // 120/min
  if (!rl.allowed) return corsError(429, 'RATE_LIMITED');

  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    columns: {
      id: true, name: true, brandColor: true, languages: true,
      primaryLang: true, greeting: true, leadCapture: true,
      quickReplies: true, customCss: true,
      allowedOrigins: true, status: true,
    },
    with: {
      faqs: {
        orderBy: [asc(schema.faqs.position)],
        limit: 4,
        columns: { question: true },
      },
    },
  });

  if (!bot)                    return corsError(404, 'BOT_NOT_FOUND');
  if (bot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');

  // Active flow (Feature #1). Owner can flip multiple flows to active but
  // the widget only runs the first one (by created_at). When present, the
  // widget walks the script before deferring to the AI engine.
  const activeFlow = await db.query.flows.findFirst({
    where: and(
      eq(schema.flows.botId, id),
      eq(schema.flows.isActive, true),
    ),
    orderBy: [asc(schema.flows.createdAt)],
    columns: { id: true, name: true, steps: true },
  });

  // Greeting A/B test — weighted random over active variants (Feature #6).
  // If no variants are defined we just return the static greeting from the
  // bots row, so the legacy code path keeps working.
  const variants = await db.query.greetingVariants.findMany({
    where: eq(schema.greetingVariants.botId, id),
    columns: { id: true, message: true, weight: true, isActive: true },
  });
  const active = variants.filter(v => v.isActive && v.weight > 0);
  let abGreeting: { id: string; message: string } | null = null;
  if (active.length > 0) {
    const total = active.reduce((s, v) => s + v.weight, 0);
    let pick = Math.random() * total;
    for (const v of active) {
      pick -= v.weight;
      if (pick <= 0) { abGreeting = { id: v.id, message: v.message }; break; }
    }
    if (!abGreeting) abGreeting = { id: active[0].id, message: active[0].message };
  }

  // Domain allowlist — only enforce when configured
  const originHeader = req.headers.get('origin') ?? req.headers.get('referer');
  if (
    Array.isArray(bot.allowedOrigins) &&
    bot.allowedOrigins.length > 0 &&
    !isOriginAllowed(bot.allowedOrigins as string[], originHeader)
  ) {
    return corsError(403, 'ORIGIN_NOT_ALLOWED', 'This bot is not authorized for this domain.');
  }

  return corsJson({
    ok: true,
    bot: {
      id:          bot.id,
      name:        bot.name,
      brandColor:  bot.brandColor,
      languages:   bot.languages,
      primaryLang: bot.primaryLang,
      greeting:    bot.greeting,
      leadCapture: bot.leadCapture,
      quickReplies: bot.quickReplies ?? [],
      customCss:    bot.customCss ?? '',
      /** When set, the widget should display abGreeting.message instead of
       *  greeting[lang] and POST /api/widget/[id]/ab on impression/conversion. */
      abGreeting,
      /** First active multi-step flow (Feature #1). Widget walks the script
       *  before falling back to AI free-chat. Null when no flow is active. */
      activeFlow: activeFlow ?? null,
      suggestions: bot.faqs.map(f => f.question).filter(q => q && q.length < 80),
    },
  });
}

export { CORS_HEADERS };
