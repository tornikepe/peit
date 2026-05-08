// POST /api/widget/[id]/lead
// Body: { name?, email?, phone?, message?, conversationId? }

import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { corsPreflight, corsJson, corsError } from '@/lib/widget-cors';

export const runtime = 'nodejs';

export async function OPTIONS() { return corsPreflight(); }

interface LeadBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  conversationId?: string;
}

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return corsError(503, 'DB_NOT_CONFIGURED');

  const id = new URL(req.url).pathname.split('/').at(-2) ?? '';
  if (!id) return corsError(400, 'MISSING_ID');

  let body: LeadBody;
  try { body = await req.json(); } catch { return corsError(400, 'INVALID_JSON'); }

  const name    = body.name?.trim()    || null;
  const email   = body.email?.trim()   || null;
  const phone   = body.phone?.trim()   || null;
  const message = body.message?.trim() || null;

  if (!email && !phone) {
    return corsError(400, 'EMAIL_OR_PHONE_REQUIRED');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return corsError(400, 'INVALID_EMAIL');
  }

  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    columns: { id: true, status: true, statsCache: true },
  });
  if (!bot)                    return corsError(404, 'BOT_NOT_FOUND');
  if (bot.status !== 'active') return corsError(403, 'BOT_NOT_ACTIVE');

  try {
    const [lead] = await db.insert(schema.leads).values({
      botId:          bot.id,
      conversationId: body.conversationId ?? null,
      name, email, phone, message,
    }).returning({ id: schema.leads.id });

    // Bump leads counter
    await db.update(schema.bots)
      .set({
        statsCache: sql`jsonb_set(coalesce(${schema.bots.statsCache}, '{}'::jsonb),
                                   '{leads}',
                                   to_jsonb(coalesce((${schema.bots.statsCache}->>'leads')::int, 0) + 1))`,
      })
      .where(eq(schema.bots.id, bot.id));

    return corsJson({ ok: true, leadId: lead.id });
  } catch (e) {
    console.error('[widget/lead] failed:', e);
    return corsError(500, 'INTERNAL', e instanceof Error ? e.message : undefined);
  }
}
