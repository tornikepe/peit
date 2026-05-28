-- Feature #6: A/B test greetings per bot.
-- A variant is "winning" when its conversion rate (a session that produced
-- at least one user message) is materially higher than its sibling's.

CREATE TABLE IF NOT EXISTS greeting_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id        uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  message       text NOT NULL,
  weight        integer NOT NULL DEFAULT 50,
  impressions   integer NOT NULL DEFAULT 0,
  conversions   integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS greeting_variants_bot_idx
  ON greeting_variants (bot_id, is_active);
