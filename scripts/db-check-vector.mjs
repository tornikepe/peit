// Verifies pgvector setup: extension + embedding column + HNSW index.

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
  console.log('\n→ pgvector extension:');
  const ext = await sql`SELECT extname, extversion FROM pg_extension WHERE extname='vector'`;
  console.log(ext.length ? `   ✅ vector v${ext[0].extversion}` : '   ❌ NOT INSTALLED');

  console.log('\n→ embedding column:');
  const cols = await sql`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name='knowledge_chunks' AND column_name='embedding'
  `;
  console.log(cols.length ? `   ✅ embedding (${cols[0].udt_name})` : '   ❌ MISSING');

  console.log('\n→ HNSW index:');
  const idx = await sql`
    SELECT indexname FROM pg_indexes
    WHERE tablename='knowledge_chunks' AND indexname='knowledge_chunks_embedding_idx'
  `;
  console.log(idx.length ? `   ✅ ${idx[0].indexname}` : '   ❌ MISSING');

  console.log('\n→ chunks:');
  const stats = await sql`
    SELECT COUNT(*)::int total,
           COUNT(embedding)::int with_embed
    FROM knowledge_chunks
  `;
  console.log(`   ${stats[0].with_embed} / ${stats[0].total} have embeddings\n`);
} finally {
  await sql.end({ timeout: 5 });
}
