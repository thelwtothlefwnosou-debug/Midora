import { getSupabaseEnv, loadEnv, tableExists } from "./db-env";

loadEnv();

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.log("NO_ENV");
    process.exit(1);
  }

  const tables = [
    "listing_unavailable_periods",
    "listing_price_rules",
    "listings",
  ];

  for (const table of tables) {
    const exists = await tableExists(url, serviceKey, table);
    console.log(`${table}: ${exists ? "EXISTS" : "MISSING"}`);
  }
}

main();
