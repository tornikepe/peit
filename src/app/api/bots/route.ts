// GET  /api/bots         → list bots for the signed-in user
// POST /api/bots         → create a bot (replaces full FAQ + chunks)

import { withAuth, jsonError } from '@/app/api/_helpers';
import {
  listBotsForUser, createBotForUser, type CreateBotInput,
} from '@/db/queries/bots';
import type { BotLang, BotTone, BotStatus } from '@/lib/bots';

export const runtime = 'nodejs';

export const GET = withAuth(async ({ user }) => {
  const bots = await listBotsForUser(user.id);
  return { ok: true, bots };
});

export const POST = withAuth(async ({ user, req }) => {
  let body: Partial<CreateBotInput>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'INVALID_JSON');
  }

  if (!body.name || body.name.trim().length < 2) {
    return jsonError(400, 'INVALID_NAME');
  }
  if (!Array.isArray(body.languages) || body.languages.length === 0) {
    return jsonError(400, 'INVALID_LANGUAGES');
  }

  const input: CreateBotInput = {
    name:         body.name.trim(),
    industry:     body.industry ?? 'services',
    languages:    body.languages as BotLang[],
    primaryLang:  (body.primaryLang ?? body.languages[0]) as BotLang,
    tone:         (body.tone ?? 'friendly') as BotTone,
    greeting:     body.greeting ?? {},
    fallback:     body.fallback ?? {},
    websiteUrl:   body.websiteUrl,
    brandColor:   body.brandColor ?? '#7c3aed',
    leadCapture:  body.leadCapture ?? { enabled: true, fields: ['name', 'email'] },
    status:       (body.status ?? 'active') as BotStatus,
    faqs:         Array.isArray(body.faqs) ? body.faqs : [],
    knowledgeChunks: Array.isArray(body.knowledgeChunks) ? body.knowledgeChunks : [],
  };

  const bot = await createBotForUser(user.id, input);
  return { ok: true, bot };
});
