-- Feature: database backup audit log (DevOps reliability).

DO $$ BEGIN
  CREATE TYPE "backup_status" AS ENUM ('success', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "backup_logs" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "status"       "backup_status" NOT NULL,
  "size_bytes"   bigint,
  "duration_ms"  integer,
  "storage_path" text,
  "error"        text,
  "created_at"   timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "backup_logs_created_idx" ON "backup_logs" ("created_at");
