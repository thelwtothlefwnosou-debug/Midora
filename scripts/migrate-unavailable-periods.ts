/**
 * Apply listing_unavailable_periods table only.
 * Run: npm run db:migrate-unavailable
 */

import {
  getPgConnectionString,
  getSupabaseEnv,
  loadEnv,
  readSql,
  runSqlViaPg,
  tableExists,
} from "./db-env";

const MIGRATION_FILE =
  "supabase/migrations/20250618140000_listing_unavailable_periods.sql";

async function main() {
  loadEnv();
  console.log("\n📌 Midora — unavailable periods migration\n");

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Λείπουν NEXT_PUBLIC_SUPABASE_URL ή SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const exists = await tableExists(url, serviceKey, "listing_unavailable_periods");
  if (exists) {
    console.log("✅ listing_unavailable_periods — already present\n");
    return;
  }

  const connectionString = getPgConnectionString();
  if (!connectionString) {
    const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "your-project";
    console.log(`❌ Χρειάζεται SUPABASE_DB_PASSWORD στο .env.local

Βρίσκεται: Supabase → Project Settings → Database → Database password

Μετά: npm run db:migrate-unavailable

Εναλλακτικά SQL Editor:
  https://supabase.com/dashboard/project/${ref}/sql/new
  Αρχείο: ${MIGRATION_FILE}
`);
    process.exit(1);
  }

  console.log("⏳ Creating listing_unavailable_periods...");
  const sql = readSql(MIGRATION_FILE);
  await runSqlViaPg(sql);

  const ok = await tableExists(url, serviceKey, "listing_unavailable_periods");
  if (!ok) {
    console.error("❌ Migration ran but table still missing");
    process.exit(1);
  }

  console.log("✅ listing_unavailable_periods ready\n");
}

main().catch((error) => {
  if (error instanceof Error && error.message === "missing_db_password") {
    console.error("❌ missing_db_password");
    process.exit(1);
  }
  console.error("❌", error);
  process.exit(1);
});
