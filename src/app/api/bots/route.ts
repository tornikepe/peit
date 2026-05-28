// GET  /api/bots         → list bots for the signed-in user
// POST /api/bots         → create a bot (replaces full FAQ + chunks)

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  listBotsForUser, createBotForUser, countBotsForUser,
  type CreateBotInput,
} from '@/db/queries/bots';
import { getOrCreateSubscription } from '@/db/queries/subscriptions';
import { getLimits } from '@/lib/plan-limits';
import type { BotLang, BotTone, BotStatus } from '@/lib/bots';
import { sanitizeQuickReplies } from '@/lib/quick-replies';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => {
  const bots = await listBotsForUser(user.id);
  return { ok: true, bots };
});

export const POST = withAuth(async ({ user, req }) => {
  let body: Partial<CreateBotInput>;
  try { body = await req.json(); }
  catch { return jsonError(400, 'INVALID_JSON'); }

  if (!body.name || body.name.trim().length < 2) {
    return jsonError(400, 'INVALID_NAME');
  }
  if (!Array.isArray(body.languages) || body.languages.length === 0) {
    return jsonError(400, 'INVALID_LANGUAGES');
  }

  // ── Plan-tier check: bot count limit ────────────────────────────────────
  const sub = await getOrCreateSubscription(user.id);
  if (!sub.usable) {
    return jsonError(402, 'TRIAL_EXPIRED', 'Trial ended — please upgrade to create bots.');
  }
  const limits = getLimits(sub.plan);
  const currentCount = await countBotsForUser(user.id);
  if (currentCount >= limits.bots) {
    return jsonError(402, 'BOT_LIMIT_REACHED', `Your ${sub.plan} plan allows ${limits.bots} bot(s). Upgrade for more.`);
  }

  // Truncate FAQ + chunks to plan limits to keep cost in check
  const faqs    = (Array.isArray(body.faqs) ? body.faqs : []).slice(0, limits.faqsPerBot);
  const chunks  = (Array.isArray(body.knowledgeChunks) ? body.knowledgeChunks : []).slice(0, limits.chunksPerBot);

  const input: CreateBotInput = {
    name:           body.name.trim(),
    industry:       body.industry ?? 'services',
    languages:      body.languages as BotLang[],
    primaryLang:    (body.primaryLang ?? body.languages[0]) as BotLang,
    tone:           (body.tone ?? 'friendly') as BotTone,
    greeting:       body.greeting ?? {},
    fallback:       body.fallback ?? {},
    websiteUrl:     body.websiteUrl,
    brandColor:     body.brandColor ?? '#7c3aed',
    leadCapture:    body.leadCapture ?? { enabled: true, fields: ['name', 'email'] },
    quickReplies:   sanitizeQuickReplies(body.quickReplies),
    allowedOrigins: limits.domainAllowlist ? (body.allowedOrigins ?? []) : [],
    status:         (body.status ?? 'active') as BotStatus,
    faqs,
    knowledgeChunks: chunks,
  };

  const bot = await createBotForUser(user.id, input);
  return { ok: true, bot };
});
