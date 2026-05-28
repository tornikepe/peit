-- Feature #10: Custom CSS for the embeddable widget.
-- Owner-controlled, sanitized before persistence (no @import, url(), or
-- IE-era expression()). Capped to 8 KB at the API layer.

ALTER TABLE bots
  ADD COLUMN IF NOT EXISTS custom_css text NOT NULL DEFAULT '';
