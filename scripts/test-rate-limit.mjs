// Hits a real bot's message endpoint 35 times to verify the per-IP
// rate limit fires at the 30th request.

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
let bot;
try {
  const rows = await sql`SELECT id, name FROM bots WHERE status='active' LIMIT 1`;
  if (!rows.length) {
    console.log('No active bot found — create one first.');
    process.exit(0);
  }
  bot = rows[0];

  // Clear any existing rate-limit row for testing
  await sql`DELETE FROM rate_limits WHERE "key" LIKE 'ip:%'`;
} finally {
  await sql.end({ timeout: 5 });
}

console.log(`Hitting bot ${bot.id} (${bot.name}) 35 times...`);
let allowed = 0, blocked = 0;
for (let i = 1; i <= 35; i++) {
  const res = await fetch(`http://localhost:3000/api/widget/${bot.id}/message`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: `test ${i}` }),
  });
  if (res.status === 429) {
    blocked++;
    if (blocked === 1) console.log(`  ❌ Rate limited at request #${i}`);
  } else if (res.ok || res.status === 200) {
    allowed++;
  } else {
    console.log(`  ⚠ Request #${i}: ${res.status}`);
  }
}
console.log(`\nTotal allowed: ${allowed}, blocked: ${blocked}`);
console.log(allowed === 30 && blocked === 5 ? '✅ Rate limit working perfectly' : '⚠ Unexpected result');
