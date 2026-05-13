// One-shot: brings the live Postgres schema up to the Lemon Squeezy world.
//
//   1. Renames subscriptions.stripe_customer_id → ls_customer_id
//   2. Renames subscriptions.stripe_subscription_id → ls_subscription_id
//   3. Adds subscriptions.ls_variant_id
//   4. Renames enum value 'starter' → 'basic'
//   5. Renames enum value 'business' → 'ultimate'
//   6. Updates the column default to 'basic'
//
// Idempotent — re-running is safe. Each step skips when already done.
//
// Usage:  node scripts/db-migrate-lemon.mjs

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
  console.error('\n❌ DATABASE_URL is missing in .env.local\n');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function columnExists(table, column) {
  const rows = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function enumHasValue(enumName, value) {
  const rows = await sql`
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = ${enumName} AND e.enumlabel = ${value}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function main() {
  console.log('→ Connecting to Postgres…');
  console.log('→ Checking current schema…');

  // ── 1. Rename stripe_customer_id → ls_customer_id ────────────────────────
  if (await columnExists('subscriptions', 'stripe_customer_id')) {
    console.log('  • Renaming stripe_customer_id → ls_customer_id');
    await sql`ALTER TABLE subscriptions RENAME COLUMN stripe_customer_id TO ls_customer_id`;
    await sql`ALTER TABLE subscriptions ALTER COLUMN ls_customer_id TYPE varchar(32)`;
  } else if (await columnExists('subscriptions', 'ls_customer_id')) {
    console.log('  ✓ ls_customer_id already exists');
  } else {
    console.log('  • Adding ls_customer_id');
    await sql`ALTER TABLE subscriptions ADD COLUMN ls_customer_id varchar(32)`;
  }

  // ── 2. Rename stripe_subscription_id → ls_subscription_id ───────────────
  if (await columnExists('subscriptions', 'stripe_subscription_id')) {
    console.log('  • Renaming stripe_subscription_id → ls_subscription_id');
    await sql`ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO ls_subscription_id`;
    await sql`ALTER TABLE subscriptions ALTER COLUMN ls_subscription_id TYPE varchar(32)`;
  } else if (await columnExists('subscriptions', 'ls_subscription_id')) {
    console.log('  ✓ ls_subscription_id already exists');
  } else {
    console.log('  • Adding ls_subscription_id');
    await sql`ALTER TABLE subscriptions ADD COLUMN ls_subscription_id varchar(32)`;
  }

  // ── 3. Add ls_variant_id if missing ─────────────────────────────────────
  if (!(await columnExists('subscriptions', 'ls_variant_id'))) {
    console.log('  • Adding ls_variant_id');
    await sql`ALTER TABLE subscriptions ADD COLUMN ls_variant_id varchar(32)`;
  } else {
    console.log('  ✓ ls_variant_id already exists');
  }

  // ── 4. Indexes on the new columns ────────────────────────────────────────
  console.log('  • Ensuring indexes…');
  await sql`CREATE INDEX IF NOT EXISTS subscriptions_ls_customer_idx ON subscriptions (ls_customer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS subscriptions_ls_subscription_idx ON subscriptions (ls_subscription_id)`;

  // ── 5. Rename enum values ───────────────────────────────────────────────
  if (await enumHasValue('subscription_plan', 'starter')) {
    console.log("  • Renaming enum 'starter' → 'basic'");
    await sql`ALTER TYPE subscription_plan RENAME VALUE 'starter' TO 'basic'`;
  } else if (await enumHasValue('subscription_plan', 'basic')) {
    console.log("  ✓ enum 'basic' already exists");
  }

  if (await enumHasValue('subscription_plan', 'business')) {
    console.log("  • Renaming enum 'business' → 'ultimate'");
    await sql`ALTER TYPE subscription_plan RENAME VALUE 'business' TO 'ultimate'`;
  } else if (await enumHasValue('subscription_plan', 'ultimate')) {
    console.log("  ✓ enum 'ultimate' already exists");
  }

  // ── 6. Column default ───────────────────────────────────────────────────
  console.log("  • Setting subscriptions.plan default → 'basic'");
  await sql`ALTER TABLE subscriptions ALTER COLUMN plan SET DEFAULT 'basic'`;

  console.log('\n✅ Done. Schema is now Lemon-Squeezy-ready.\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Migration failed:\n', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
