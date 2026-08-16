/**
 * Snapshot every table to timestamped, gzipped JSON on the droplet.
 *
 *   cd /opt/teacher-planner
 *   docker run --rm -v /opt/teacher-planner:/app -w /app --env-file .env \
 *     node:22-alpine node scripts/snapshot_data.mjs
 *
 * WHAT THIS IS, AND WHAT IT IS NOT
 * --------------------------------
 * It is a recovery artifact the school holds itself: every row, readable
 * without Supabase, restorable by anyone who can POST JSON. Cheap enough to
 * run before each pilot day.
 *
 * It is NOT a database backup. It has no schema, no policies, no functions,
 * no auth.users, and no point-in-time granularity. Restoring from it means
 * re-applying migrations first and re-creating accounts separately. Treat it
 * as the floor under the pilot, not as a reason to skip provider backups.
 *
 * Table list comes from the PostgREST OpenAPI document rather than a
 * hardcoded array, so a table added later is included without anyone
 * remembering to add it here — the failure mode of a hand-maintained list is
 * that the newest and least understood data is the data you did not keep.
 */

import { gzipSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.");
  process.exit(78); // EX_CONFIG
}

const OUT_DIR = process.argv[2] ?? "backups";
const PAGE = 1000;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function tableNames() {
  const res = await fetch(`${url}/rest/v1/`, { headers });
  if (!res.ok) throw new Error(`OpenAPI fetch failed: ${res.status}`);
  const spec = await res.json();
  return Object.keys(spec.definitions ?? {}).sort();
}

/** Page through a table. PostgREST caps rows per request. */
async function fetchAll(table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=*&limit=${PAGE}&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
mkdirSync(OUT_DIR, { recursive: true });

const tables = await tableNames();
const snapshot = {};
const counts = {};
const failures = [];

for (const t of tables) {
  try {
    const rows = await fetchAll(t);
    snapshot[t] = rows;
    counts[t] = rows.length;
  } catch (e) {
    // Record the gap rather than writing a snapshot that silently omits a
    // table. A backup you believe is complete and is not is worse than a
    // backup you know has a hole in it.
    failures.push(`${t}: ${e.message}`);
    counts[t] = null;
  }
}

const path = `${OUT_DIR}/snapshot-${stamp}.json.gz`;
writeFileSync(
  path,
  gzipSync(
    JSON.stringify(
      { taken_at: new Date().toISOString(), counts, failures, data: snapshot },
      null,
      1,
    ),
  ),
);

const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
console.log(`\n${path}`);
console.log(`  ${tables.length} tables, ${total} rows\n`);
for (const [t, c] of Object.entries(counts)) {
  if (c) console.log(`    ${String(c).padStart(6)}  ${t}`);
}
const empty = Object.entries(counts).filter(([, c]) => c === 0).map(([t]) => t);
if (empty.length) console.log(`\n  empty (${empty.length}): ${empty.join(", ")}`);
if (failures.length) {
  console.log(`\n  FAILED (${failures.length}):`);
  for (const f of failures) console.log(`    - ${f}`);
}
console.log("");
process.exit(failures.length ? 1 : 0);
