-- Adds per-period Claude token usage tracking to subscriptions.
-- Reset on billing-period rollover alongside messagesThisPeriod.

ALTER TABLE "subscriptions"
  ADD COLUMN "tokens_input_this_period"  integer NOT NULL DEFAULT 0,
  ADD COLUMN "tokens_output_this_period" integer NOT NULL DEFAULT 0,
  ADD COLUMN "tokens_cached_this_period" integer NOT NULL DEFAULT 0;
