-- Analytics dashboard: per-conversation geo so we can show the country/city
-- breakdown without an external API call at read time. Populated at write
-- time (widget/message, widget/stream, TG webhook, Meta webhook) from the
-- edge headers Vercel injects: x-vercel-ip-country, x-vercel-ip-city.
--
-- All columns are nullable so existing rows keep working unchanged.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS country varchar(2);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS city    varchar(80);

CREATE INDEX IF NOT EXISTS conversations_country_idx ON conversations(country);
