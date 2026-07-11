/**
 * Apply short-term pricing columns on listings.
 * Run: npx tsx scripts/migrate-short-term-pricing.ts
 */

import {
  columnExists,
  getPgConnectionString,
  getSupabaseEnv,
  loadEnv,
  readSql,
  runSqlViaPg,
} from "./db-env";

const MIGRATION_FILE = "supabase/migrations/20250711120000_short_term_pricing_fields.sql";

async function main() {
  loadEnv();
  console.log("\n📌 Midora — short-term pricing fields migration\n");

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const exists = await columnExists(url, serviceKey, "listings", "weekend_price_per_night");
  if (exists) {
    console.log("✅ weekend_price_per_night — already present\n");
    return;
  }

  const connectionString = getPgConnectionString();
  if (!connectionString) {
    const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "your-project";
    console.log(`❌ Needs SUPABASE_DB_PASSWORD in .env.local

Find it: Supabase → Project Settings → Database → Database password

Then run: npx tsx scripts/migrate-short-term-pricing.ts

Or SQL Editor:
  https://supabase.com/dashboard/project/${ref}/sql/new
  File: ${MIGRATION_FILE}
`);
    process.exit(1);
  }

  console.log("⏳ Applying short-term pricing columns...");
  const sql = readSql(MIGRATION_FILE);
  await runSqlViaPg(sql);

  const ok = await columnExists(url, serviceKey, "listings", "weekend_price_per_night");
  if (!ok) {
    console.error("❌ Migration ran but column still missing");
    process.exit(1);
  }

  console.log("✅ Short-term pricing fields ready\n");
}

main().catch((error) => {
  if (error instanceof Error && error.message === "missing_db_password") {
    console.error("❌ missing_db_password");
    process.exit(1);
  }
  console.error("❌", error);
  process.exit(1);
});
