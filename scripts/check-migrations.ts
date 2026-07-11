/**
 * Verify critical Supabase migrations are applied.
 * Uses direct Postgres when SUPABASE_DB_PASSWORD is set (accurate),
 * otherwise falls back to REST API probes.
 * Run: npm run db:check-migrations
 */

import {
  columnExists,
  getPgConnectionString,
  getSupabaseEnv,
  loadEnv,
  tableExists,
} from "./db-env";

type PgClient = import("pg").Client;

type Check = {
  id: string;
  label: string;
  table?: string;
  column?: string;
  tableOnly?: string;
};

const CHECKS: Check[] = [
  {
    id: "short_term_pricing_weekend",
    label: "listings.weekend_price_per_night (short-term pricing)",
    table: "listings",
    column: "weekend_price_per_night",
  },
  {
    id: "short_term_pricing_weekend_days",
    label: "listings.weekend_days (short-term pricing)",
    table: "listings",
    column: "weekend_days",
  },
  {
    id: "short_term_pricing_weekly_discount",
    label: "listings.weekly_discount_percent (short-term pricing)",
    table: "listings",
    column: "weekly_discount_percent",
  },
  {
    id: "short_term_pricing_monthly_discount",
    label: "listings.monthly_discount_percent (short-term pricing)",
    table: "listings",
    column: "monthly_discount_percent",
  },
  {
    id: "short_term_pricing_cleaning_note",
    label: "listings.cleaning_fee_note (short-term pricing)",
    table: "listings",
    column: "cleaning_fee_note",
  },
  {
    id: "profile_display_name",
    label: "profiles.display_name (profile page)",
    table: "profiles",
    column: "display_name",
  },
  {
    id: "profile_bio",
    label: "profiles.bio (profile page)",
    table: "profiles",
    column: "bio",
  },
  {
    id: "profile_advertiser_type",
    label: "profiles.advertiser_type (profile page)",
    table: "profiles",
    column: "advertiser_type",
  },
  {
    id: "bedroom_bed_size_note",
    label: "listing_sleeping_arrangements.bed_size_note",
    table: "listing_sleeping_arrangements",
    column: "bed_size_note",
  },
  {
    id: "unavailable_periods_table",
    label: "listing_unavailable_periods table",
    tableOnly: "listing_unavailable_periods",
  },
  {
    id: "price_rules_table",
    label: "listing_price_rules table",
    tableOnly: "listing_price_rules",
  },
  {
    id: "supports_short_term",
    label: "listings.supports_short_term (rental modes)",
    table: "listings",
    column: "supports_short_term",
  },
  {
    id: "minimum_stay_nights",
    label: "listings.minimum_stay_nights (short-term)",
    table: "listings",
    column: "minimum_stay_nights",
  },
];

async function loadPgState(): Promise<{
  tables: Set<string>;
  columns: Set<string>;
} | null> {
  const connectionString = getPgConnectionString();
  if (!connectionString) return null;

  const { Client } = await import("pg");
  const client: PgClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const tableRows = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const columnRows = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `);

    return {
      tables: new Set(tableRows.rows.map((r) => String(r.table_name))),
      columns: new Set(
        columnRows.rows.map((r) => `${r.table_name}.${r.column_name}`)
      ),
    };
  } finally {
    await client.end();
  }
}

async function main() {
  loadEnv();
  console.log("\n🔍 Midora — migration status\n");

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase env keys");
    process.exit(1);
  }

  const pgState = await loadPgState();
  console.log(
    pgState
      ? "✅ Checking via direct Postgres (accurate)"
      : "⚠️  Checking via REST API only (add SUPABASE_DB_PASSWORD for accuracy)"
  );
  console.log("");

  let failed = 0;
  const missing: string[] = [];

  for (const check of CHECKS) {
    let ok = false;

    if (pgState) {
      if (check.tableOnly) {
        ok = pgState.tables.has(check.tableOnly);
      } else if (check.table && check.column) {
        ok = pgState.columns.has(`${check.table}.${check.column}`);
      }
    } else if (check.tableOnly) {
      ok = await tableExists(url, serviceKey, check.tableOnly);
    } else if (check.table && check.column) {
      ok = await columnExists(url, serviceKey, check.table, check.column);
    }

    console.log(`${ok ? "✅" : "❌"} ${check.label}`);
    if (!ok) {
      failed++;
      missing.push(check.id);
    }
  }

  console.log("");
  if (failed === 0) {
    console.log("✅ Όλα τα κρίσιμα migrations είναι εφαρμοσμένα.\n");
    process.exit(0);
  }

  console.log(`❌ ${failed} migration check(s) failed.\n`);
  if (missing.includes("short_term_pricing_weekend")) {
    console.log("→ Τρέξε: npm run db:migrate-short-term-pricing");
  }
  if (missing.some((id) => id.includes("profile"))) {
    console.log("→ Profile: supabase/migrations/20250707120000_profile_public_fields.sql");
  }
  if (missing.includes("unavailable_periods_table")) {
    console.log("→ Τρέξε: npm run db:migrate-unavailable");
  }
  if (missing.includes("price_rules_table")) {
    console.log("→ Price rules: supabase/migrations/20250621120000_listing_wizard_fields.sql");
  }
  console.log("");
  process.exit(1);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
