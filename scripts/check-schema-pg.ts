import { getPgConnectionString, loadEnv } from "./db-env";

async function main() {
  loadEnv();
  const connectionString = getPgConnectionString();
  if (!connectionString) {
    console.log("NO_CONN");
    process.exit(1);
  }

  const { Client } = await import("pg");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('listing_unavailable_periods', 'listing_price_rules')
      ORDER BY 1
    `);
    console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", ") || "none");

    const cols = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'listings' AND column_name IN (
            'supports_short_term', 'minimum_stay_nights', 'weekend_price_per_night',
            'weekend_days', 'weekly_discount_percent', 'monthly_discount_percent', 'cleaning_fee_note'
          ))
          OR (table_name = 'profiles' AND column_name IN ('display_name', 'bio', 'advertiser_type'))
          OR (table_name = 'listing_sleeping_arrangements' AND column_name = 'bed_size_note')
        )
      ORDER BY table_name, column_name
    `);

    for (const row of cols.rows) {
      console.log(`COL: ${row.table_name}.${row.column_name}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("ERROR", err);
  process.exit(1);
});
