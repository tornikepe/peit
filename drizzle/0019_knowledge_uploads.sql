-- Feature #9: PDF / DOCX / TXT uploads as a knowledge source.
-- Existing chunks (from website crawl) get implicit source='crawl'; new
-- rows from uploaded documents carry source='upload' plus filename + the
-- Vercel Blob URL so the dashboard can list / delete / re-process them.

DO $$ BEGIN
  CREATE TYPE knowledge_source AS ENUM ('crawl', 'upload');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE knowledge_chunks
  ADD COLUMN IF NOT EXISTS source   knowledge_source NOT NULL DEFAULT 'crawl',
  ADD COLUMN IF NOT EXISTS filename text,
  ADD COLUMN IF NOT EXISTS blob_url text;

-- Lookup all chunks belonging to a given upload (delete / re-process flows).
CREATE INDEX IF NOT EXISTS knowledge_chunks_filename_idx
  ON knowledge_chunks (bot_id, filename)
  WHERE filename IS NOT NULL;
