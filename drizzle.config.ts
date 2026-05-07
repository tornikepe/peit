import type { Config } from 'drizzle-kit';
import { readFileSync, existsSync } from 'node:fs';

// drizzle-kit doesn't load .env.local by default — load it manually here.
// Precedence: existing process.env wins (so production / CI overrides work).
function loadEnvLocal() {
  const path = '.env.local';
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)?\s*$/i);
    if (!m) continue;
    const key = m[1];
    if (process.env[key]) continue; // don't overwrite real env
    let value = (m[2] ?? '').trim();
    // strip optional surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnvLocal();

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is missing. Add it to .env.local — see .env.local.example',
  );
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
} satisfies Config;
