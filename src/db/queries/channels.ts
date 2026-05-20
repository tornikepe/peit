// Channel connection queries. One row per (bot, channel) in bot_channels.
// All channel-level operations (connect, disconnect, increment counter,
// look up by webhook routing key) flow through this module.

import { and, eq, sql } from 'drizzle-orm';
import { requireDb, schema } from '@/db';
import type {
  DbChannel, TelegramChannelCreds, MetaChannelCreds,
} from '@/db/schema';

export type ChannelKind = 'telegram' | 'instagram' | 'facebook';

/** Internal: rejects channel kinds we never persist (`web`, `playground`). */
function assertConnectable(k: string): asserts k is ChannelKind {
  if (k !== 'telegram' && k !== 'instagram' && k !== 'facebook') {
    throw new Error(`Channel "${k}" is not connectable`);
  }
}

export async function listChannelsForBot(botId: string): Promise<DbChannel[]> {
  const db = requireDb();
  return db.query.botChannels.findMany({
    where: eq(schema.botChannels.botId, botId),
  });
}

export async function getChannel(
  botId: string,
  channel: ChannelKind,
): Promise<DbChannel | undefined> {
  assertConnectable(channel);
  const db = requireDb();
  return db.query.botChannels.findFirst({
    where: and(
      eq(schema.botChannels.botId, botId),
      eq(schema.botChannels.channel, channel),
    ),
  });
}

/**
 * Idempotently insert / update a (bot, channel) row with fresh credentials.
 * Re-connecting a channel for the same bot overwrites stale credentials and
 * clears any previous error state.
 */
export async function upsertChannel<C extends Record<string, unknown>>(
  botId:        string,
  channel:      ChannelKind,
  credentials:  C,
): Promise<DbChannel> {
  assertConnectable(channel);
  const db = requireDb();
  const [row] = await db.insert(schema.botChannels)
    .values({
      botId,
      channel,
      status:      'active',
      credentials,
      lastError:   null,
    })
    .onConflictDoUpdate({
      target: [schema.botChannels.botId, schema.botChannels.channel],
      set: {
        status:      'active',
        credentials,
        lastError:   null,
        updatedAt:   new Date(),
      },
    })
    .returning();
  return row;
}

/**
 * Mark a channel disconnected. Keeps the row so we can show "Reconnect"
 * UX without losing historical stats, but blanks credentials so a stale
 * token can never resurface.
 */
export async function disconnectChannel(
  botId: string,
  channel: ChannelKind,
): Promise<void> {
  assertConnectable(channel);
  const db = requireDb();
  await db.update(schema.botChannels)
    .set({
      status:      'disconnected',
      credentials: {},
      lastError:   null,
      updatedAt:   new Date(),
    })
    .where(and(
      eq(schema.botChannels.botId, botId),
      eq(schema.botChannels.channel, channel),
    ));
}

/**
 * Look up a TG-connected bot by its webhook secret. The secret is part of
 * the webhook URL path, so a single global webhook endpoint can route the
 * incoming update to the right bot without exposing bot IDs in the URL.
 */
export async function findTelegramBotByWebhookSecret(
  secret: string,
): Promise<{ botId: string; creds: TelegramChannelCreds } | null> {
  const db = requireDb();
  // JSONB containment lookup — the existing unique-by-bot index doesn't
  // help here, but channel volume per deployment is tiny (one row per bot).
  const rows = await db
    .select({
      botId:       schema.botChannels.botId,
      credentials: schema.botChannels.credentials,
      status:      schema.botChannels.status,
    })
    .from(schema.botChannels)
    .where(and(
      eq(schema.botChannels.channel, 'telegram'),
      eq(schema.botChannels.status, 'active'),
      sql`${schema.botChannels.credentials} @> ${JSON.stringify({ webhookSecret: secret })}::jsonb`,
    ))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const creds = row.credentials as TelegramChannelCreds;
  if (!creds?.botToken) return null;
  return { botId: row.botId, creds };
}

/** Page-ID-indexed lookup for Meta inbound webhooks. */
export async function findMetaBotByPageId(
  pageId: string,
  channel: 'instagram' | 'facebook',
): Promise<{ botId: string; creds: MetaChannelCreds } | null> {
  const db = requireDb();
  const rows = await db
    .select({
      botId:       schema.botChannels.botId,
      credentials: schema.botChannels.credentials,
    })
    .from(schema.botChannels)
    .where(and(
      eq(schema.botChannels.channel, channel),
      eq(schema.botChannels.status, 'active'),
      sql`${schema.botChannels.credentials} @> ${JSON.stringify({ pageId })}::jsonb`,
    ))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const creds = row.credentials as MetaChannelCreds;
  if (!creds?.pageAccessToken) return null;
  return { botId: row.botId, creds };
}

/** Bump the inbound counter + timestamp after a successful message dispatch. */
export async function recordInbound(botId: string, channel: ChannelKind): Promise<void> {
  assertConnectable(channel);
  const db = requireDb();
  await db.update(schema.botChannels)
    .set({
      lastInboundAt: new Date(),
      totalInbound:  sql`${schema.botChannels.totalInbound} + 1`,
      updatedAt:     new Date(),
    })
    .where(and(
      eq(schema.botChannels.botId, botId),
      eq(schema.botChannels.channel, channel),
    ));
}

/** Mark a channel errored so the dashboard can show "Reconnect needed". */
export async function markChannelError(
  botId: string,
  channel: ChannelKind,
  message: string,
): Promise<void> {
  assertConnectable(channel);
  const db = requireDb();
  await db.update(schema.botChannels)
    .set({
      status:    'error',
      lastError: message.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(and(
      eq(schema.botChannels.botId, botId),
      eq(schema.botChannels.channel, channel),
    ));
}
