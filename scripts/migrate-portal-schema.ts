/**
 * Apply portal + admin migrations to Supabase.
 * Run: npm run db:migrate-portal
 */

import {
  columnExists,
  getSupabaseEnv,
  readSql,
  runSqlViaPg,
  tableExists,
} from "./db-env";

const INCREMENTAL_MIGRATIONS: { label: string; check: () => Promise<boolean>; file: string }[] = [
  {
    label: "portal minimal",
    check: async () => {
      const { url, serviceKey } = getSupabaseEnv();
      if (!url || !serviceKey) return true;
      return columnExists(url, serviceKey, "listings", "ama_number");
    },
    file: "supabase/apply-portal-minimal.sql",
  },
  {
    label: "rental mode fields",
    check: async () => {
      const { url, serviceKey } = getSupabaseEnv();
      if (!url || !serviceKey) return true;
      return columnExists(url, serviceKey, "listings", "minimum_stay_months");
    },
    file: "supabase/migrations/20250623120000_listing_rental_mode_fields.sql",
  },
  {
    label: "short-term experience",
    check: async () => {
      const { url, serviceKey } = getSupabaseEnv();
      if (!url || !serviceKey) return true;
      return columnExists(url, serviceKey, "listings", "pets_policy");
    },
    file: "supabase/migrations/20250623140000_short_term_listing_experience.sql",
  },
  {
    label: "listing view_count",
    check: async () => {
      const { url, serviceKey } = getSupabaseEnv();
      if (!url || !serviceKey) return true;
      return columnExists(url, serviceKey, "listings", "view_count");
    },
    file: "supabase/migrations/20250621140000_listing_view_count.sql",
  },
  {
    label: "listing unavailable periods",
    check: async () => {
      const { url, serviceKey } = getSupabaseEnv();
      if (!url || !serviceKey) return true;
      return tableExists(url, serviceKey, "listing_unavailable_periods");
    },
    file: "supabase/migrations/20250618140000_listing_unavailable_periods.sql",
  },
];

async function applySqlFile(file: string, label: string) {
  console.log(`⏳ Applying ${label}...`);
  const sql = readSql(file);
  await runSqlViaPg(sql);
  console.log(`✅ ${label} applied`);
}

async function main() {
  console.log("\n📌 Midora — portal schema migration\n");

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Λείπουν NEXT_PUBLIC_SUPABASE_URL ή SUPABASE_SERVICE_ROLE_KEY στο .env.local");
    process.exit(1);
  }

  for (const migration of INCREMENTAL_MIGRATIONS) {
    const done = await migration.check();
    if (done) {
      console.log(`✅ ${migration.label} — already present`);
      continue;
    }
    try {
      await applySqlFile(migration.file, migration.label);
    } catch (error) {
      if (error instanceof Error && error.message === "missing_db_password") {
        const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "your-project";
        console.log(`⚠️  Χρειάζεται SUPABASE_DB_PASSWORD στο .env.local

Βρίσκεται: Supabase → Project Settings → Database → Database password

Μετά: npm run db:migrate-portal

Εναλλακτικά SQL Editor:
  https://supabase.com/dashboard/project/${ref}/sql/new
  Αρχείο: ${migration.file}
`);
        process.exit(1);
      }
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
  }

  const checks = [
    ["listings", "ama_number"],
    ["listings", "approval_status"],
    ["listings", "minimum_stay_months"],
    ["listings", "pets_policy"],
    ["admin_audit_logs", "id"],
    ["listing_images", "file_name"],
    ["listing_unavailable_periods", "id"],
  ] as const;

  let ok = true;
  for (const [table, col] of checks) {
    const exists = await columnExists(url, serviceKey, table, col);
    console.log(exists ? `✅ ${table}.${col}` : `❌ ${table}.${col} missing`);
    if (!exists) ok = false;
  }

  if (!ok) {
    console.error("\n❌ Migration incomplete — run SQL files in Supabase SQL Editor");
    process.exit(1);
  }

  console.log("\n✅ Portal schema ready\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
