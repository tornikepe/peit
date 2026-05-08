// GET /api/widget/[id]/config — public, CORS-enabled.

import { eq, asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { CORS_HEADERS, corsPreflight, corsJson, corsError } from '@/lib/widget-cors';

export const runtime = 'nodejs';

export async function OPTIONS() { return corsPreflight(); }

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const { id } = await params;
  if (!id) return corsError(400, 'MISSING_ID');

  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    columns: {
      id: true, name: true, brandColor: true, languages: true,
      primaryLang: true, greeting: true, leadCapture: true, status: true,
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
      suggestions: bot.faqs.map(f => f.question).filter(q => q && q.length < 80),
    },
  });
}

export { CORS_HEADERS };
