/**
 * Admin registry audit — checks DB columns and pending listing registry values.
 * Run: npx tsx scripts/check-admin-registry.ts [listingId]
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { getAdminRegistryDisplay } from "../src/lib/admin/registry-display";

function loadEnv() {
  try {
    readFileSync(resolve(".env.local"), "utf-8")
      .split("\n")
      .forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eq = trimmed.indexOf("=");
        if (eq === -1) return;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      });
  } catch {
    // ignore
  }
}

loadEnv();

const listingId = process.argv[2];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env in .env.local");
    process.exit(1);
  }

  const db = createClient(url, key);

  const columnsToCheck = [
    "ama_number",
    "legal_registry_type",
    "rental_type",
    "approval_status",
    "accepts_under_60_days",
    "address_street",
    "price_per_night",
    "owner_responsibility_accepted",
    "is_hidden",
  ] as const;

  const missing: string[] = [];
  for (const col of columnsToCheck) {
    const { error } = await db.from("listings").select(col).limit(1);
    if (error?.message.includes("does not exist")) missing.push(col);
  }

  if (missing.length) {
    console.log("❌ Missing columns on listings:");
    for (const col of missing) console.log("   -", col);
    console.log("\n→ Apply migrations in Supabase SQL Editor (in order):");
    console.log("   1. supabase/migrations/20250617120000_listing_portal_fields.sql");
    console.log("   2. supabase/migrations/20250621120000_listing_wizard_fields.sql");
    console.log("   3. supabase/migrations/20250620120000_admin_control_room.sql");
    console.log("   (or run all files under supabase/migrations/ chronologically)");
    process.exit(1);
  }
  console.log("✅ Core portal/admin columns exist on listings table");

  const { error: auditErr } = await db.from("admin_audit_logs").select("id").limit(1);
  if (auditErr?.message.includes("does not exist")) {
    console.log("⚠️  admin_audit_logs table missing — run 20250620120000_admin_control_room.sql");
  } else {
    console.log("✅ admin_audit_logs table OK");
  }

  // legacy single-column probe kept for clarity
  const { error: colErr } = await db
    .from("listings")
    .select("ama_number, legal_registry_type, accepts_under_60_days, approval_status")
    .limit(1);

  if (colErr) {
    console.log("❌ Registry columns probe failed:", colErr.message);
    process.exit(1);
  }

  const { data: pending, error: pendingErr } = await db
    .from("listings")
    .select(
      "id, title, rental_type, ama_number, legal_registry_type, accepts_under_60_days, status, approval_status"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  if (pendingErr) {
    console.error("Pending query failed:", pendingErr.message);
    process.exit(1);
  }

  console.log(`\n📋 Pending listings (${pending?.length ?? 0}):`);
  for (const row of pending ?? []) {
    const display = getAdminRegistryDisplay(row);
    console.log(`- ${row.title?.slice(0, 40)}…`);
    console.log(`  id: ${row.id}`);
    console.log(`  rental_type: ${row.rental_type} | ama: ${row.ama_number ?? "NULL"} | type: ${row.legal_registry_type ?? "NULL"}`);
    console.log(`  admin display: [${display.kind}] ${display.text}`);
  }

  if (listingId) {
    const { data: one, error } = await db
      .from("listings")
      .select(
        "id, title, rental_type, ama_number, legal_registry_type, accepts_under_60_days, status, approval_status, address_street, address_number, price_per_night, price_monthly, owner_responsibility_accepted, platform_role_accepted"
      )
      .eq("id", listingId)
      .maybeSingle();

    if (error || !one) {
      console.error("\nListing not found:", error?.message);
      process.exit(1);
    }

    const display = getAdminRegistryDisplay(one);
    console.log(`\n🔍 Detail for ${listingId}:`);
    console.log(JSON.stringify({ ...one, adminRegistryDisplay: display }, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
