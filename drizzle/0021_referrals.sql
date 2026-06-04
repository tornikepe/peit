-- Feature: Referral program
-- Adds referral fields to users + a referrals table.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(40);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "free_months_earned" integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_idx" ON "users" ("referral_code");

-- Self-referential FK (a referred user points at their referrer).
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fk"
    FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "referral_status" AS ENUM ('pending', 'rewarded', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "referrals" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrer_id"  uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referred_id"  uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status"       "referral_status" NOT NULL DEFAULT 'pending',
  "rewarded_at"  timestamp,
  "created_at"   timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referred_idx" ON "referrals" ("referred_id");
CREATE INDEX IF NOT EXISTS "referrals_referrer_idx" ON "referrals" ("referrer_id");
