-- Feature #2: Quick replies / custom buttons.
-- Per-bot list of pill-buttons rendered above the widget input.
-- Each entry: { label: string, action: 'message'|'url'|'flow', value: string }

ALTER TABLE bots
  ADD COLUMN IF NOT EXISTS quick_replies jsonb NOT NULL DEFAULT '[]'::jsonb;
