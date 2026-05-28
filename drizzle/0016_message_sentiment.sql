-- Feature #5: sentiment classification on incoming user messages.
-- Stored as text (nullable) — null = unclassified (no API key, or the
-- classifier call failed). Indexed for the dashboard sentiment filter.

DO $$ BEGIN
  CREATE TYPE message_sentiment AS ENUM ('positive', 'neutral', 'negative', 'frustrated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sentiment message_sentiment;

CREATE INDEX IF NOT EXISTS messages_sentiment_idx
  ON messages (sentiment)
  WHERE sentiment IS NOT NULL;
