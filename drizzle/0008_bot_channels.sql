-- Multi-channel integration: per-(bot, channel) connection rows that hold
-- credentials, status, and lightweight stats. See src/db/schema.ts for
-- the typed JSON shape (TelegramChannelCreds / MetaChannelCreds).
--
-- Idempotent: every CREATE uses IF NOT EXISTS, the enum is created with
-- DO $$ guard, and the unique index uses IF NOT EXISTS. Safe to re-run.

DO $$ BEGIN
  CREATE TYPE bot_channel_status AS ENUM ('active', 'disconnected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS bot_channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id          UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  channel         channel NOT NULL,
  status          bot_channel_status NOT NULL DEFAULT 'active',
  credentials     JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_inbound_at TIMESTAMP,
  total_inbound   INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS bot_channels_bot_idx
  ON bot_channels(bot_id);

-- One connection per (bot, channel). Re-connecting a TG bot updates the
-- existing row instead of duplicating credentials.
CREATE UNIQUE INDEX IF NOT EXISTS bot_channels_bot_channel_idx
  ON bot_channels(bot_id, channel);
