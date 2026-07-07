/**
 * Apply listing view_count column + increment_listing_view RPC.
 * Run: npm run db:migrate-listing-views
 */

import {
  columnExists,
  getSupabaseEnv,
  readSql,
  runSqlViaPg,
} from "./db-env";

async function rpcExists(url: string, serviceKey: string): Promise<boolean> {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/increment_listing_view`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_listing_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await res.text();
  if (body.includes("increment_listing_view") && body.includes("Could not find")) {
    return false;
  }
  return true;
}

async function main() {
  console.log("\n📌 Midora — listing views migration\n");

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Λείπουν NEXT_PUBLIC_SUPABASE_URL ή SUPABASE_SERVICE_ROLE_KEY στο .env.local");
    process.exit(1);
  }

  const hasColumn = await columnExists(url, serviceKey, "listings", "view_count");
  const hasRpc = await rpcExists(url, serviceKey);

  if (hasColumn && hasRpc) {
    console.log("✅ view_count + increment_listing_view — already present");
    return;
  }

  const sql = readSql("supabase/migrations/20250621140000_listing_view_count.sql");

  try {
    console.log("⏳ Applying listing view_count migration...");
    await runSqlViaPg(sql);
    console.log("✅ Migration applied");
  } catch (error) {
    if (error instanceof Error && error.message === "missing_db_password") {
      const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "your-project";
      console.log(`⚠️  Χρειάζεται SUPABASE_DB_PASSWORD στο .env.local

Βρίσκεται: Supabase → Project Settings → Database → Database password

Μετά: npm run db:migrate-listing-views

Εναλλακτικά SQL Editor:
  https://supabase.com/dashboard/project/${ref}/sql/new
  Αρχείο: supabase/migrations/20250621140000_listing_view_count.sql
`);
      process.exit(1);
    }
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  const columnOk = await columnExists(url, serviceKey, "listings", "view_count");
  const rpcOk = await rpcExists(url, serviceKey);
  console.log(columnOk ? "✅ listings.view_count" : "❌ listings.view_count missing");
  console.log(rpcOk ? "✅ increment_listing_view()" : "❌ increment_listing_view() missing");

  if (!columnOk || !rpcOk) {
    process.exit(1);
  }

  console.log("\n✅ Listing views ready — open a listing page to test\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
