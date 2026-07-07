import { createClient } from "@supabase/supabase-js";
import { loadEnv, getSupabaseEnv } from "./db-env";

loadEnv();

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: approved, count: approvedCount } = await db
    .from("listings")
    .select("id, slug, title", { count: "exact", head: false })
    .eq("status", "approved")
    .limit(3);

  const { count: spitoCount } = await db
    .from("listings")
    .select("id", { count: "exact", head: true })
    .like("slug", "spitogatos-%");

  const { count: seedCount } = await db
    .from("listings")
    .select("id", { count: "exact", head: true })
    .like("slug", "seed-%");

  const { count: adminCount } = await db
    .from("listings")
    .select("id", { count: "exact", head: true })
    .like("slug", "admin-review-demo-%");

  const { data: imgSample } = await db
    .from("listing_images")
    .select("url")
    .limit(3);

  console.log(JSON.stringify({
    approvedTotal: approvedCount ?? 0,
    spitogatosImports: spitoCount ?? 0,
    oldSeedListings: seedCount ?? 0,
    adminDemoListings: adminCount ?? 0,
    sampleApproved: approved?.map((r) => r.slug) ?? [],
    sampleImageUrls: imgSample?.map((r) => r.url?.slice(0, 80)) ?? [],
  }, null, 2));
}

main();
