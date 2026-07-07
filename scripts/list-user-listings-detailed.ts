import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

const userId = process.argv[2] ?? "91bc4f10-bf5f-44d5-b9f5-1b4a978116fd";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: listings } = await db
    .from("listings")
    .select("id, title, status, sqm, created_at, updated_at")
    .eq("user_id", userId)
    .neq("status", "approved")
    .order("created_at", { ascending: false });

  console.log("\nDraft/pending listings (newest first):\n");
  for (const listing of listings ?? []) {
    const { count } = await db
      .from("listing_images")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listing.id);
    console.log(
      `${listing.created_at?.slice(0, 19)} | ${listing.id.slice(0, 8)}… | ${listing.title} | photos=${count ?? 0} | sqm=${listing.sqm}`
    );
  }
  console.log("");
}

main().catch(console.error);
