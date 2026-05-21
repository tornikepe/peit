-- Conversation history feature: owner-side tags + human handoff flag.
--
-- `tags` is a free-form JSONB string[] — same shape as bots.languages so
-- the UI can reuse the chip-input pattern. We don't normalise to a
-- separate table because the user-visible cardinality is tiny (a single
-- owner rarely manages >50 distinct tags) and JSONB containment queries
-- handle filter-by-tag at the speed of a btree on this volume.
--
-- `is_handed_off` flips when the owner clicks "Hand off to human" in the
-- transcript panel; the answer engine reads this flag and short-circuits
-- to a polite "an agent will reply soon" message instead of generating
-- a bot answer. Added an index because the inbound webhook hits it on
-- every message.
--
-- Idempotent: column adds use IF NOT EXISTS, index creates use IF NOT EXISTS.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags          jsonb       NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_handed_off boolean     NOT NULL DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handed_off_at timestamp;

CREATE INDEX IF NOT EXISTS conversations_handoff_idx
  ON conversations(is_handed_off);
