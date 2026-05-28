-- Feature #7: Thumbs up/down feedback on bot messages.
-- Stored as varchar (nullable) — null = no rating, 'positive' or 'negative'
-- = visitor's last vote (only the most recent click sticks).

DO $$ BEGIN
  CREATE TYPE message_feedback AS ENUM ('positive', 'negative');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS feedback message_feedback;

-- Quickly find negative-rated messages for the dashboard tab.
CREATE INDEX IF NOT EXISTS messages_feedback_idx
  ON messages (feedback)
  WHERE feedback IS NOT NULL;
