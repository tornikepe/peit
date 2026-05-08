// GET /api/widget/[id]/config
// Public, CORS-enabled. Returns just enough info for the widget to render.
// Internal fields (ownerId, FAQs, knowledgeChunks) are NEVER exposed.

import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { CORS_HEADERS, corsPreflight, corsJson, corsError } from '@/lib/widget-cors';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const segments = new URL(req.url).pathname.split('/');
  const id = segments[segments.indexOf('widget') + 1] ?? '';
  if (!id) return corsError(400, 'MISSING_ID');

  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    columns: {
      id: true,
      name: true,
      brandColor: true,
      languages: true,
      primaryLang: true,
      greeting: true,
      leadCapture: true,
      status: true,
    },
  });

  if (!bot)                    return corsError(404, 'BOT_NOT_FOUND');
  if (bot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');

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
    },
  });
}

// Re-export so Next.js attaches headers on plain responses too
export { CORS_HEADERS };
