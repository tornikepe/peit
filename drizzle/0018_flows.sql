-- Feature #1: multi-step conversation flows.
-- A flow is a small state machine: a list of typed steps the widget walks
-- through before handing control back to the AI engine. Steps live in a
-- jsonb column so we don't need a join table per step.

CREATE TABLE IF NOT EXISTS flows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name        varchar(120) NOT NULL,
  steps       jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active   boolean NOT NULL DEFAULT false,
  created_at  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flows_bot_idx ON flows (bot_id, is_active);
