/**
 * One-off: apply monthly occupancy pricing (+ recent pending) migrations.
 * Run: npx tsx scripts/apply-monthly-occupancy-migration.ts
 */
import { loadEnv, readSql, runSqlViaPg } from "./db-env";

const FILES = [
  "supabase/migrations/20260718160000_listing_legal_declarations.sql",
  "supabase/migrations/20260719180000_listing_wizard_resume_step.sql",
  "supabase/migrations/20260724120000_listing_monthly_occupancy_pricing.sql",
] as const;

async function main() {
  loadEnv();
  console.log("\n📌 Apply monthly occupancy migrations\n");

  for (const file of FILES) {
    console.log(`⏳ ${file}`);
    try {
      await runSqlViaPg(readSql(file));
      console.log(`✅ ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("already exists") ||
        message.includes("duplicate key") ||
        message.includes("already applied")
      ) {
        console.log(`⚠️  ${file} — skipped (${message.slice(0, 100)})`);
        continue;
      }
      console.error(`❌ ${file}\n   ${message}`);
      process.exit(1);
    }
  }

  console.log("\n✅ Done.\n");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
