import { columnExists, getSupabaseEnv, loadEnv } from "./db-env";

const COLUMNS = [
  "weekend_price_per_night",
  "weekend_days",
  "weekly_discount_percent",
  "monthly_discount_percent",
  "cleaning_fee_note",
] as const;

async function main() {
  loadEnv();
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.log("MISSING_ENV");
    process.exit(1);
  }

  let allOk = true;
  for (const column of COLUMNS) {
    const ok = await columnExists(url, serviceKey, "listings", column);
    console.log(`${column}:${ok ? "OK" : "MISSING"}`);
    if (!ok) allOk = false;
  }

  process.exit(allOk ? 0 : 2);
}

main().catch((err) => {
  console.error("ERROR", err);
  process.exit(1);
});
