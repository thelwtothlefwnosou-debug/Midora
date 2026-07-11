/**
 * Apply pending Supabase migrations (idempotent).
 * Run: npm run db:apply-pending-migrations
 */

import { getPgConnectionString, loadEnv, readSql, runSqlViaPg } from "./db-env";

const MIGRATION_FILES = [
  "supabase/migrations/20250618140000_listing_unavailable_periods.sql",
  "supabase/migrations/20250621120000_listing_wizard_fields.sql",
  "supabase/migrations/20250623120000_listing_rental_mode_fields.sql",
  "supabase/add-features.sql",
  "supabase/migrations/20250623140000_short_term_listing_experience.sql",
  "supabase/migrations/20250706120000_listing_bedroom_details.sql",
  "supabase/migrations/20250707120000_profile_public_fields.sql",
  "supabase/migrations/20250711120000_short_term_pricing_fields.sql",
] as const;

async function main() {
  loadEnv();
  console.log("\n📌 Midora — apply pending migrations\n");

  const connectionString = getPgConnectionString();
  if (!connectionString) {
    console.error("❌ Missing SUPABASE_DB_PASSWORD in .env.local");
    process.exit(1);
  }

  for (const file of MIGRATION_FILES) {
    console.log(`⏳ ${file}`);
    try {
      const sql = readSql(file);
      await runSqlViaPg(sql);
      console.log(`✅ ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("already exists") ||
        message.includes("duplicate key") ||
        message.includes("IF NOT EXISTS")
      ) {
        console.log(`⚠️  ${file} — skipped (already applied)`);
        continue;
      }
      console.error(`❌ ${file}\n   ${message}`);
      process.exit(1);
    }
  }

  console.log("\n✅ Pending migrations applied.\n");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
