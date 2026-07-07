import "server-only";

const MIGRATION_FILE =
  "supabase/migrations/20250618140000_listing_unavailable_periods.sql";

let migrationAttempted = false;

export async function ensureUnavailablePeriodsTable(): Promise<boolean> {
  if (migrationAttempted) return false;
  migrationAttempted = true;

  try {
    const { getPgConnectionString, readSql, runSqlViaPg, tableExists, getSupabaseEnv } =
      await import("../../scripts/db-env");

    const { url, serviceKey } = getSupabaseEnv();
    if (!url || !serviceKey) return false;

    const exists = await tableExists(url, serviceKey, "listing_unavailable_periods");
    if (exists) return true;

    const connectionString = getPgConnectionString();
    if (!connectionString) return false;

    await runSqlViaPg(readSql(MIGRATION_FILE));
    return await tableExists(url, serviceKey, "listing_unavailable_periods");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ensureUnavailablePeriodsTable]", error);
    }
    return false;
  }
}
