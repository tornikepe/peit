// Quick health check — lists tables in your DATABASE_URL.

import { readFileSync, existsSync } from 'node:fs';
import postgres from 'postgres';

if (existsSync('.env.local')) {
  const raw = readFileSync('.env.local', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)?\s*$/i);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = (m[2] ?? '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' ORDER BY tablename`;
  console.log(`\n✅ ${tables.length} tables in DB:\n`);
  for (const t of tables) console.log(`   • ${t.tablename}`);
  console.log('');
} finally {
  await sql.end({ timeout: 5 });
}
