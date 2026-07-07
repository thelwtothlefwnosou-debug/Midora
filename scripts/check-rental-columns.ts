import { columnExists, getSupabaseEnv } from "./db-env";

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env");
    process.exit(1);
  }
  const cols = [
    "minimum_stay_months",
    "supports_short_term",
    "supports_monthly",
    "minimum_stay_nights",
    "monthly_terms",
    "monthly_includes_bills",
  ];
  for (const c of cols) {
    const ok = await columnExists(url, serviceKey, "listings", c);
    console.log(`${ok ? "OK" : "MISSING"} listings.${c}`);
  }
}

main();
