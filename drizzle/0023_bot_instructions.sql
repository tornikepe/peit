-- Feature: per-bot custom instructions (owner tailors the bot to their business).
ALTER TABLE "bots" ADD COLUMN IF NOT EXISTS "instructions" text NOT NULL DEFAULT '';
