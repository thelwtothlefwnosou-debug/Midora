/**
 * Apply listing_images metadata migration to Supabase.
 * Run: npm run db:migrate-listing-images
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

async function columnExists(column: string): Promise<boolean> {
  if (!url || !serviceKey) return false;
  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/listing_images?select=${column}&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  if (res.ok) return true;
  const body = await res.text();
  return !body.includes("Could not find") && !body.includes(column);
}

async function runSqlViaPg(sql: string): Promise<void> {
  const connectionString =
    databaseUrl ||
    (dbPassword && url
      ? (() => {
          const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
          if (!ref) throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL");
          return `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;
        })()
      : null);

  if (!connectionString) {
    throw new Error("missing_db_password");
  }

  const { Client } = await import("pg");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log("\n📌 Midora — listing_images migration\n");

  if (!url || !serviceKey) {
    console.error("❌ Λείπουν NEXT_PUBLIC_SUPABASE_URL ή SUPABASE_SERVICE_ROLE_KEY στο .env.local");
    process.exit(1);
  }

  if (await columnExists("file_name")) {
    console.log("✅ Οι στήλες metadata του listing_images υπάρχουν ήδη");
    return;
  }

  const sqlPath = resolve(
    process.cwd(),
    "supabase/migrations/20250622140000_listing_images_metadata.sql"
  );
  const rlsPath = resolve(
    process.cwd(),
    "supabase/migrations/20250622140100_listing_images_rls.sql"
  );
  const addFeaturesPath = resolve(process.cwd(), "supabase/add-features.sql");
  const sql =
    readFileSync(addFeaturesPath, "utf-8") +
    "\n" +
    readFileSync(sqlPath, "utf-8") +
    "\n" +
    readFileSync(rlsPath, "utf-8");

  try {
    await runSqlViaPg(sql);
    console.log("✅ Migration εφαρμόστηκε — listing_images metadata + RLS");
  } catch (error) {
    if (error instanceof Error && error.message === "missing_db_password") {
      const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "your-project";
      console.log(`⚠️  Χρειάζεται database password για αυτόματο migration.

Πρόσθεσε στο .env.local:
  SUPABASE_DB_PASSWORD=your-db-password

Μετά ξανατρέξε:
  npm run db:migrate-listing-images

Ή τρέξε χειροκίνητα στο Supabase SQL Editor:
  https://supabase.com/dashboard/project/${ref}/sql/new

Αρχεία:
  supabase/migrations/20250622140000_listing_images_metadata.sql
  supabase/migrations/20250622140100_listing_images_rls.sql
`);
      process.exit(1);
    }

    console.error("❌ Migration απέτυχε:", error);
    process.exit(1);
  }

  if (!(await columnExists("file_name"))) {
    console.error("❌ Η στήλη file_name δεν εμφανίζεται — κάνε reload schema στο Supabase");
    process.exit(1);
  }

  console.log("\n✅ Έτοιμο — δοκίμασε ξανά upload φωτογραφιών στο wizard\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
