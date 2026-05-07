// Bot CRUD — DB-backed. All queries are scoped to the owning user.

import { and, asc, desc, eq } from 'drizzle-orm';
import { requireDb, schema } from '@/db';
import type { Bot, BotLang, BotStatus, BotTone, FAQItem, KnowledgeChunk } from '@/lib/bots';

/** Convert a DB bot + child rows into the front-end Bot shape. */
function rowToBot(
  row: typeof schema.bots.$inferSelect,
  faqRows: (typeof schema.faqs.$inferSelect)[],
  chunkRows: (typeof schema.knowledgeChunks.$inferSelect)[],
): Bot {
  return {
    id:           row.id,
    name:         row.name,
    industry:     row.industry,
    languages:    row.languages as BotLang[],
    primaryLang:  row.primaryLang as BotLang,
    tone:         row.tone as BotTone,
    greeting:     row.greeting as Partial<Record<BotLang, string>>,
    fallback:     row.fallback as Partial<Record<BotLang, string>>,
    websiteUrl:   row.websiteUrl ?? undefined,
    brandColor:   row.brandColor,
    leadCapture:  row.leadCapture as Bot['leadCapture'],
    status:       row.status as BotStatus,
    createdAt:    row.createdAt.toISOString(),
    updatedAt:    row.updatedAt.toISOString(),
    stats:        row.statsCache as Bot['stats'],
    faqs: faqRows
      .sort((a, b) => a.position - b.position)
      .map<FAQItem>(f => ({ id: f.id, q: f.question, a: f.answer })),
    knowledgeChunks: chunkRows.map<KnowledgeChunk>(c => ({
      id:       c.id,
      heading:  c.heading,
      content:  c.content,
      keywords: c.keywords,
    })),
  };
}

export async function listBotsForUser(userDbId: string): Promise<Bot[]> {
  const db = requireDb();

  const rows = await db.query.bots.findMany({
    where: eq(schema.bots.ownerId, userDbId),
    orderBy: [desc(schema.bots.createdAt)],
    with: {
      faqs:   { orderBy: [asc(schema.faqs.position)] },
      chunks: true,
    },
  });

  return rows.map(r =>
    rowToBot(
      r,
      r.faqs as (typeof schema.faqs.$inferSelect)[],
      r.chunks as (typeof schema.knowledgeChunks.$inferSelect)[],
    ),
  );
}

export async function getBotForUser(userDbId: string, botId: string): Promise<Bot | null> {
  const db = requireDb();

  const row = await db.query.bots.findFirst({
    where: and(eq(schema.bots.id, botId), eq(schema.bots.ownerId, userDbId)),
    with: {
      faqs:   { orderBy: [asc(schema.faqs.position)] },
      chunks: true,
    },
  });
  if (!row) return null;

  return rowToBot(
    row,
    row.faqs as (typeof schema.faqs.$inferSelect)[],
    row.chunks as (typeof schema.knowledgeChunks.$inferSelect)[],
  );
}

export interface CreateBotInput {
  name: string;
  industry: string;
  languages: BotLang[];
  primaryLang: BotLang;
  tone: BotTone;
  greeting: Partial<Record<BotLang, string>>;
  fallback: Partial<Record<BotLang, string>>;
  websiteUrl?: string;
  brandColor: string;
  leadCapture: Bot['leadCapture'];
  status: BotStatus;
  faqs: { q: string; a: string }[];
  knowledgeChunks: { heading: string; content: string; keywords: string[] }[];
}

export async function createBotForUser(
  userDbId: string,
  input: CreateBotInput,
): Promise<Bot> {
  const db = requireDb();

  return await db.transaction(async tx => {
    const [bot] = await tx.insert(schema.bots)
      .values({
        ownerId:     userDbId,
        name:        input.name,
        industry:    input.industry,
        languages:   input.languages,
        primaryLang: input.primaryLang,
        tone:        input.tone,
        greeting:    input.greeting as Record<string, string>,
        fallback:    input.fallback as Record<string, string>,
        websiteUrl:  input.websiteUrl,
        brandColor:  input.brandColor,
        leadCapture: input.leadCapture,
        status:      input.status,
      })
      .returning();

    const faqRows = input.faqs.length
      ? await tx.insert(schema.faqs).values(
          input.faqs.map((f, i) => ({
            botId:    bot.id,
            question: f.q,
            answer:   f.a,
            position: i,
          })),
        ).returning()
      : [];

    const chunkRows = input.knowledgeChunks.length
      ? await tx.insert(schema.knowledgeChunks).values(
          input.knowledgeChunks.map(c => ({
            botId:    bot.id,
            heading:  c.heading,
            content:  c.content,
            keywords: c.keywords,
          })),
        ).returning()
      : [];

    return rowToBot(bot, faqRows, chunkRows);
  });
}

export interface UpdateBotInput {
  name?: string;
  industry?: string;
  languages?: BotLang[];
  primaryLang?: BotLang;
  tone?: BotTone;
  greeting?: Partial<Record<BotLang, string>>;
  fallback?: Partial<Record<BotLang, string>>;
  websiteUrl?: string | null;
  brandColor?: string;
  leadCapture?: Bot['leadCapture'];
  status?: BotStatus;
  /** Replace full FAQ list. */
  faqs?: { q: string; a: string }[];
  /** Replace full chunk list. */
  knowledgeChunks?: { heading: string; content: string; keywords: string[] }[];
  stats?: Bot['stats'];
}

export async function updateBotForUser(
  userDbId: string,
  botId: string,
  patch: UpdateBotInput,
): Promise<Bot | null> {
  const db = requireDb();

  return await db.transaction(async tx => {
    // Verify ownership
    const owner = await tx.query.bots.findFirst({
      where: and(eq(schema.bots.id, botId), eq(schema.bots.ownerId, userDbId)),
    });
    if (!owner) return null;

    // Build update object
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.name !== undefined)        update.name = patch.name;
    if (patch.industry !== undefined)    update.industry = patch.industry;
    if (patch.languages !== undefined)   update.languages = patch.languages;
    if (patch.primaryLang !== undefined) update.primaryLang = patch.primaryLang;
    if (patch.tone !== undefined)        update.tone = patch.tone;
    if (patch.greeting !== undefined)    update.greeting = patch.greeting;
    if (patch.fallback !== undefined)    update.fallback = patch.fallback;
    if (patch.websiteUrl !== undefined)  update.websiteUrl = patch.websiteUrl;
    if (patch.brandColor !== undefined)  update.brandColor = patch.brandColor;
    if (patch.leadCapture !== undefined) update.leadCapture = patch.leadCapture;
    if (patch.status !== undefined)      update.status = patch.status;
    if (patch.stats !== undefined)       update.statsCache = patch.stats;

    await tx.update(schema.bots)
      .set(update)
      .where(eq(schema.bots.id, botId));

    if (patch.faqs !== undefined) {
      await tx.delete(schema.faqs).where(eq(schema.faqs.botId, botId));
      if (patch.faqs.length) {
        await tx.insert(schema.faqs).values(
          patch.faqs.map((f, i) => ({
            botId, question: f.q, answer: f.a, position: i,
          })),
        );
      }
    }

    if (patch.knowledgeChunks !== undefined) {
      await tx.delete(schema.knowledgeChunks).where(eq(schema.knowledgeChunks.botId, botId));
      if (patch.knowledgeChunks.length) {
        await tx.insert(schema.knowledgeChunks).values(
          patch.knowledgeChunks.map(c => ({
            botId, heading: c.heading, content: c.content, keywords: c.keywords,
          })),
        );
      }
    }

    // Re-read fresh
    const fresh = await tx.query.bots.findFirst({
      where: eq(schema.bots.id, botId),
      with: {
        faqs:   { orderBy: [asc(schema.faqs.position)] },
        chunks: true,
      },
    });
    if (!fresh) return null;
    return rowToBot(
      fresh,
      fresh.faqs as (typeof schema.faqs.$inferSelect)[],
      fresh.chunks as (typeof schema.knowledgeChunks.$inferSelect)[],
    );
  });
}

export async function deleteBotForUser(
  userDbId: string,
  botId: string,
): Promise<boolean> {
  const db = requireDb();
  const result = await db.delete(schema.bots)
    .where(and(eq(schema.bots.id, botId), eq(schema.bots.ownerId, userDbId)))
    .returning({ id: schema.bots.id });
  return result.length > 0;
}
