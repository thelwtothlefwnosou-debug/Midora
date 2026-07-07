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

const listingId = process.argv[2] ?? "415ccd99-9f2b-487e-b970-0382a2ed5e1d";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const withOrder = await db
    .from("listing_images")
    .select("id, media_type, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  const withoutOrder = await db
    .from("listing_images")
    .select("id, media_type")
    .eq("listing_id", listingId);

  const headCount = await db
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  const star = await db
    .from("listing_images")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order");

  const minimal = await db
    .from("listing_images")
    .select("id, listing_id, url, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  console.log(
    JSON.stringify(
      {
        withOrder: {
          error: withOrder.error?.message ?? null,
          count: withOrder.data?.length ?? 0,
        },
        withoutOrder: {
          error: withoutOrder.error?.message ?? null,
          count: withoutOrder.data?.length ?? 0,
        },
        headCount: headCount.count,
        starSelect: {
          error: star.error?.message ?? null,
          count: star.data?.length ?? 0,
        },
        minimalSelect: {
          error: minimal.error?.message ?? null,
          count: minimal.data?.length ?? 0,
        },
      },
      null,
      2
    )
  );
}

main().catch(console.error);
