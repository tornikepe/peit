-- Stripe → Lemon Squeezy migration.
-- Renames Stripe columns and adds ls_variant_id for plan-change detection.
-- Safe to run even if existing rows have stripe_* values populated — those
-- values are kept (LS IDs happen to fit in 32 chars too).

ALTER TABLE "subscriptions"
  RENAME COLUMN "stripe_customer_id" TO "ls_customer_id";

ALTER TABLE "subscriptions"
  RENAME COLUMN "stripe_subscription_id" TO "ls_subscription_id";

-- Shrink to LS's smaller ID size (numeric strings, well under 32 chars).
ALTER TABLE "subscriptions"
  ALTER COLUMN "ls_customer_id" TYPE varchar(32);

ALTER TABLE "subscriptions"
  ALTER COLUMN "ls_subscription_id" TYPE varchar(32);

ALTER TABLE "subscriptions"
  ADD COLUMN "ls_variant_id" varchar(32);

CREATE INDEX IF NOT EXISTS "subscriptions_ls_customer_idx"
  ON "subscriptions" ("ls_customer_id");

CREATE INDEX IF NOT EXISTS "subscriptions_ls_subscription_idx"
  ON "subscriptions" ("ls_subscription_id");
