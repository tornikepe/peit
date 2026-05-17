-- Email system: per-user preferences (marketing opt-out, lead alerts on/off)
-- + locale (for email language) + de-dup timestamps on subscriptions so the
-- trial-reminder cron never sends twice.

ALTER TABLE "users"
  ADD COLUMN "email_prefs" jsonb NOT NULL DEFAULT '{"leadAlerts":true,"productUpdates":true,"trialReminders":true}',
  ADD COLUMN "locale"      varchar(4) NOT NULL DEFAULT 'ka';

ALTER TABLE "subscriptions"
  ADD COLUMN "trial_reminder_sent_at"  timestamp,
  ADD COLUMN "trial_ended_notified_at" timestamp,
  ADD COLUMN "welcome_email_sent_at"   timestamp;
