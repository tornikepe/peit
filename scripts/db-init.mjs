// One-shot DB initializer — applies all generated migrations
// (./drizzle/*.sql) to DATABASE_URL with NO interactive prompts.
//
// Usage:  npm run db:init
//
// Prereqs:
//   1. DATABASE_URL set in .env.local
//   2. `npm run db:generate` has produced ./drizzle/0000_*.sql

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// ─── Load .env.local ───────────────────────────────────────────────────────
const envPath = '.env.local';
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)?\s*$/i);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = (m[2] ?? '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('\n❌ DATABASE_URL is missing.\n   Add it to .env.local — see .env.local.example\n');
  process.exit(1);
}

const migrationsFolder = resolve('./drizzle');
if (!existsSync(migrationsFolder)) {
  console.error(`\n❌ ${migrationsFolder} not found.\n   Run "npm run db:generate" first.\n`);
  process.exit(1);
}

const sqlFiles = readdirSync(migrationsFolder).filter(f => f.endsWith('.sql'));
if (sqlFiles.length === 0) {
  console.error('\n❌ No .sql migration files in ./drizzle.\n   Run "npm run db:generate" first.\n');
  process.exit(1);
}

console.log(`→ Connecting to Postgres...`);
console.log(`→ Found ${sqlFiles.length} migration file(s): ${sqlFiles.join(', ')}`);

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  console.log(`→ Applying migrations...`);
  await migrate(db, { migrationsFolder });
  console.log(`\n✅ Database is ready.\n   Run "npm run db:studio" to inspect tables.\n`);
} catch (err) {
  console.error(`\n❌ Migration failed:\n`, err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
