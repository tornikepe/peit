// One-shot: adds the lead_score enum + leads.score column + index.
// Idempotent — safe to re-run. Backfills existing rows by computing their
// score from current name/email/phone/message values.

import { readFileSync, existsSync } from 'node:fs';
import postgres from 'postgres';

// ─── Load .env.local ─────────────────────────────────────────────────────
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
  console.error('\n❌ DATABASE_URL missing in .env.local\n');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

const HOT_KEYWORDS = [
  'ვყიდულობ', 'მინდა ვიყიდო', 'ფასი', 'ღირებულება', 'შეკვეთა', 'შეძენა',
  'შეთავაზება', 'ჯავშანი', 'ვაჯავშნი', 'სასწრაფო',
  'buy', 'purchase', 'price', 'pricing', 'order', 'demo', 'invoice', 'quote',
  'купить', 'цена', 'заказ', 'оплата',
];

async function enumExists(name, value) {
  const r = await sql`
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = ${name} AND e.enumlabel = ${value} LIMIT 1
  `;
  return r.length > 0;
}

async function columnExists(table, column) {
  const r = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column} LIMIT 1
  `;
  return r.length > 0;
}

function scoreFor({ email, phone, message }) {
  const hasEmail = !!email?.trim();
  const hasPhone = !!phone?.trim();
  const lower    = (message ?? '').toLowerCase();
  const hot      = HOT_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
  if (hasEmail && hasPhone && hot) return 'hot';
  if (hasEmail && hasPhone)        return 'warm';
  if (hot && (hasEmail || hasPhone)) return 'hot';
  if (hasEmail || hasPhone)        return 'warm';
  return 'cold';
}

async function main() {
  console.log('→ Connecting to Postgres…');

  // 1. Create the enum type if missing
  const typeExists = await sql`
    SELECT 1 FROM pg_type WHERE typname = 'lead_score' LIMIT 1
  `;
  if (typeExists.length === 0) {
    console.log("  • Creating enum 'lead_score'");
    await sql`CREATE TYPE lead_score AS ENUM ('cold', 'warm', 'hot')`;
  } else {
    console.log("  ✓ enum 'lead_score' exists");
    // Make sure all values are present
    for (const v of ['cold', 'warm', 'hot']) {
      if (!(await enumExists('lead_score', v))) {
        await sql.unsafe(`ALTER TYPE lead_score ADD VALUE IF NOT EXISTS '${v}'`);
      }
    }
  }

  // 2. Add column if missing
  if (!(await columnExists('leads', 'score'))) {
    console.log("  • Adding leads.score column (default 'cold')");
    await sql`ALTER TABLE leads ADD COLUMN score lead_score NOT NULL DEFAULT 'cold'`;
  } else {
    console.log('  ✓ leads.score already exists');
  }

  // 3. Index
  await sql`CREATE INDEX IF NOT EXISTS leads_score_idx ON leads (score)`;
  console.log('  ✓ leads_score_idx ensured');

  // 4. Backfill existing rows that still have default 'cold' but should be warmer
  const rows = await sql`
    SELECT id, email, phone, message FROM leads WHERE score = 'cold'
  `;
  let updated = 0;
  for (const r of rows) {
    const next = scoreFor(r);
    if (next !== 'cold') {
      await sql`UPDATE leads SET score = ${next} WHERE id = ${r.id}`;
      updated++;
    }
  }
  console.log(`  ✓ Backfilled ${updated} row(s) from 'cold' → warmer score`);

  console.log('\n✅ Done. leads.score is live.\n');
}

main()
  .catch(err => { console.error('\n❌ Migration failed:\n', err); process.exitCode = 1; })
  .finally(() => sql.end({ timeout: 5 }));
