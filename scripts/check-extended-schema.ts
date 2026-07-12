import { getPgConnectionString, loadEnv } from "./db-env";

type Probe = { label: string; kind: "table" | "column"; table: string; column?: string };

const PROBES: Probe[] = [
  { label: "favorites", kind: "table", table: "favorites" },
  { label: "property_leads", kind: "table", table: "property_leads" },
  { label: "listing_reports", kind: "table", table: "listing_reports" },
  { label: "locations", kind: "table", table: "locations" },
  { label: "listing_highlights", kind: "table", table: "listing_highlights" },
  { label: "listing_amenities", kind: "table", table: "listing_amenities" },
  { label: "listings.availability_status", kind: "column", table: "listings", column: "availability_status" },
  { label: "listings.approval_status", kind: "column", table: "listings", column: "approval_status" },
  { label: "listings.published_at", kind: "column", table: "listings", column: "published_at" },
  { label: "listings.view_count", kind: "column", table: "listings", column: "view_count" },
  { label: "property_leads.interest_start_date", kind: "column", table: "property_leads", column: "interest_start_date" },
  { label: "profiles.avatar_path", kind: "column", table: "profiles", column: "avatar_path" },
  { label: "profiles.account_status", kind: "column", table: "profiles", column: "account_status" },
  { label: "listing_images.storage_path", kind: "column", table: "listing_images", column: "storage_path" },
  { label: "listing_images.media_type", kind: "column", table: "listing_images", column: "media_type" },
  { label: "listings.location_confirmed_by_owner", kind: "column", table: "listings", column: "location_confirmed_by_owner" },
  { label: "listings.phone_verified_at", kind: "column", table: "listings", column: "phone_verified_at" },
];

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

  try {
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);
    const columns = await client.query(`
      SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'
    `);

    const tableSet = new Set(tables.rows.map((r) => String(r.table_name)));
    const colSet = new Set(columns.rows.map((r) => `${r.table_name}.${r.column_name}`));

    console.log("\n🔍 Extended schema audit\n");
    let missing = 0;
    for (const probe of PROBES) {
      const ok =
        probe.kind === "table"
          ? tableSet.has(probe.table)
          : colSet.has(`${probe.table}.${probe.column}`);
      console.log(`${ok ? "✅" : "❌"} ${probe.label}`);
      if (!ok) missing++;
    }
    console.log(missing === 0 ? "\n✅ Extended schema OK\n" : `\n❌ ${missing} missing\n`);
    process.exit(missing === 0 ? 0 : 2);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
