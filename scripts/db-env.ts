import { readFileSync } from "fs";
import { resolve } from "path";

export function loadEnv() {
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

  const pwdArg = process.argv.find((a) => a.startsWith("--password="));
  if (pwdArg) {
    process.env.SUPABASE_DB_PASSWORD = pwdArg.slice("--password=".length);
  }
}

export function getSupabaseEnv() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return { url, serviceKey };
}

export function getPgConnectionString(): string | null {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) return databaseUrl;

  const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!dbPassword || !url) return null;

  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) return null;

  // Project "mid term" is West EU (Paris) → eu-west-3
  const region = process.env.SUPABASE_DB_REGION?.trim() || "eu-west-3";
  return `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
}

export async function runSqlViaPg(sql: string): Promise<void> {
  const connectionString = getPgConnectionString();
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

export function readSql(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf-8");
}

export const PORTAL_MIGRATION_FILES = [
  "supabase/migrations/20250615120000_favorites.sql",
  "supabase/migrations/20250615130000_property_leads.sql",
  "supabase/migrations/20250617100000_listing_availability_status.sql",
  "supabase/migrations/20250617120000_listing_portal_fields.sql",
  "supabase/migrations/20250617130000_lead_portal_safe.sql",
  "supabase/migrations/20250618120000_listing_reports.sql",
  "supabase/migrations/20250618140000_listing_unavailable_periods.sql",
  "supabase/migrations/20250619120000_lead_interest_dates.sql",
  "supabase/migrations/20250620120000_admin_control_room.sql",
  "supabase/migrations/20250621120000_listing_wizard_fields.sql",
  "supabase/add-features.sql",
  "supabase/migrations/20250622140000_listing_images_metadata.sql",
  "supabase/migrations/20250622140100_listing_images_rls.sql",
] as const;

export async function columnExists(
  url: string,
  serviceKey: string,
  table: string,
  column: string
): Promise<boolean> {
  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/${table}?select=${column}&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  if (res.ok) return true;
  const body = await res.text();
  return !body.includes("does not exist") && !body.includes("Could not find");
}

export async function tableExists(
  url: string,
  serviceKey: string,
  table: string
): Promise<boolean> {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (res.ok) return true;
  const body = await res.text();
  return !body.includes("does not exist") && !body.includes("Could not find");
}
