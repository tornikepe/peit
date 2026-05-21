-- Settings section: team workspace + programmatic API keys.
--
-- team_members
--   One row per (owner, invitee_email) — the owner-side workspace gets a
--   list of pending + accepted invites. Cross-tenant access enforcement
--   is out of scope here; only the invite + email + role storage lives in
--   this table. UX in /dashboard/settings/team manages it.
--
-- api_keys
--   Stripe / OpenAI pattern: raw key shown once at creation, only the
--   SHA-256 digest stored at rest, lookup uses a 12-char prefix for
--   indexed reverse-lookup without revealing the secret. SHA-256 is
--   sufficient because the key body is 48 hex chars (192 bits) — bcrypt
--   adds no meaningful security at that entropy and would inflate the
--   verify step on every API call.
--
-- email_prefs (users.email_prefs)
--   No DDL change — the column is already JSONB. Two new optional flags
--   (`handoffAlerts`, `weeklyReport`) get default values in the queries
--   layer (resolvePrefs) so legacy rows behave the same as new ones.
--
-- Idempotent: every CREATE uses IF NOT EXISTS, enums are guarded.

DO $$ BEGIN
  CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE team_status AS ENUM ('pending', 'active', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  role          team_role   NOT NULL DEFAULT 'member',
  status        team_status NOT NULL DEFAULT 'pending',
  invite_token  VARCHAR(64),
  invited_at    TIMESTAMP DEFAULT NOW() NOT NULL,
  accepted_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS team_members_user_idx ON team_members(user_id);
-- One invite per (owner, email) — re-inviting same email updates the row.
CREATE UNIQUE INDEX IF NOT EXISTS team_members_owner_email_idx
  ON team_members(user_id, email);

CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(80) NOT NULL,
  key_hash     VARCHAR(64) NOT NULL,
  prefix       VARCHAR(16) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP,
  revoked_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS api_keys_user_idx   ON api_keys(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON api_keys(prefix);
