-- Feature #3: file & image uploads in chat.
-- Each message can carry attachments (images / documents the visitor sent).
-- Stored as a jsonb array of { url, pathname, filename, mimeType, kind }.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
