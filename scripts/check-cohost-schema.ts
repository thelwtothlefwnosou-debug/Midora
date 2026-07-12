import { getPgConnectionString, loadEnv } from "./db-env";

async function main() {
  loadEnv();
  const cs = getPgConnectionString();
  if (!cs) {
    console.log("NO_CONN");
    process.exit(1);
  }
  const { Client } = await import("pg");
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('listing_cohosts','property_leads','profiles')
    ORDER BY 1
  `);
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name IN ('public_slug','public_profile_enabled')
    ORDER BY 1
  `);
  console.log("tables:", tables.rows);
  console.log("profile cols:", cols.rows);
  const count = await client.query(`SELECT count(*)::int AS n FROM listing_cohosts`).catch(() => ({ rows: [{ n: "missing" }] }));
  console.log("listing_cohosts rows:", count.rows[0]);
  await client.end();
}

main();
