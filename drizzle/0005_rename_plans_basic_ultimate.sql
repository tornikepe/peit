-- Rename plan slugs to match Lemon Squeezy variants:
--   starter  → basic
--   business → ultimate
-- Postgres 10+ supports ALTER TYPE … RENAME VALUE which rewrites every row
-- in-place; no need to touch existing subscriptions data.

ALTER TYPE "subscription_plan" RENAME VALUE 'starter'  TO 'basic';
ALTER TYPE "subscription_plan" RENAME VALUE 'business' TO 'ultimate';

-- Update the column default to match the new slug.
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'basic';
