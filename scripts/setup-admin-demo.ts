/**
 * One-shot: migrate portal schema + seed 10 admin review listings.
 * Run: npm run db:setup-admin
 *
 * Needs in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DB_PASSWORD  (Settings → Database → password)
 */

import { execSync } from "child_process";
import { resolve } from "path";

const root = resolve(process.cwd());

function run(label: string, script: string) {
  console.log(`\n▶ ${label}\n`);
  execSync(`npx tsx ${script}`, { cwd: root, stdio: "inherit", env: process.env });
}

async function main() {
  console.log("\n🚀 Midora — full admin setup (migrate + seed)\n");
  run("Step 1/2 — Portal schema", "scripts/migrate-portal-schema.ts");
  run("Step 2/2 — 10 demo listings", "scripts/seed-admin-review-listings.ts");
  console.log("\n✅ Όλα έτοιμα. Άνοιξε: http://localhost:3000/admin/listings/review\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
