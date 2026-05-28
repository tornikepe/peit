-- Feature #8: opt-in periodic re-sync of the bot's website knowledge.
--
-- `last_crawled_at` already exists on bots — we reuse it for "last synced".
-- This migration adds the cadence: sync_interval_days = 0 turns auto-sync
-- off; positive values are the number of days between auto-recrawls.

ALTER TABLE bots
  ADD COLUMN IF NOT EXISTS sync_interval_days integer NOT NULL DEFAULT 7;
