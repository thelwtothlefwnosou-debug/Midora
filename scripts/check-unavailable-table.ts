import { getSupabaseEnv, loadEnv, tableExists } from "./db-env";

loadEnv();

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.log("MISSING_ENV");
    process.exit(1);
  }
  const exists = await tableExists(url, serviceKey, "listing_unavailable_periods");
  console.log(exists ? "EXISTS" : "MISSING");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
