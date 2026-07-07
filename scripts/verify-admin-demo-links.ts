import { createClient } from "@supabase/supabase-js";
import { loadEnv, getSupabaseEnv } from "./db-env";
import { getAdminListingById } from "../src/lib/admin/queries";

loadEnv();

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing env");
    process.exit(1);
  }

  const db = createClient(url, serviceKey);
  const { data: demos, error } = await db
    .from("listings")
    .select("id, slug, title, status")
    .like("slug", "admin-review-demo-%")
    .order("slug");

  if (error) {
    console.error("DB error:", error.message);
    process.exit(1);
  }

  console.log(`\n✅ ${demos?.length ?? 0} demo listings in DB:\n`);
  for (const d of demos ?? []) {
    const { count } = await db
      .from("listing_images")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", d.id);
    console.log(`  ${d.slug}`);
    console.log(`    id: ${d.id}`);
    console.log(`    title: ${d.title}`);
    console.log(`    photos: ${count ?? 0}`);
    console.log(`    url: http://localhost:3000/admin/listings/${d.id}`);
  }

  const first = demos?.[0];
  if (first) {
    const viaQuery = await getAdminListingById(first.id);
    console.log(
      `\ngetAdminListingById('${first.id}'):`,
      viaQuery ? `OK — ${viaQuery.title}` : "NULL (would 404!)"
    );
    if (!viaQuery) {
      const bare = await db.from("listings").select("id, title").eq("id", first.id).maybeSingle();
      const withImages = await db
        .from("listings")
        .select("id, listing_images(id)")
        .eq("id", first.id)
        .maybeSingle();
      const withProfiles = await db
        .from("listings")
        .select("id, profiles(id, full_name)")
        .eq("id", first.id)
        .maybeSingle();
      console.log("  bare listing:", bare.error?.message ?? bare.data?.title);
      console.log("  + images:", withImages.error?.message ?? `${withImages.data?.listing_images?.length ?? 0} imgs`);
      console.log("  + profiles:", withProfiles.error?.message ?? withProfiles.data?.profiles);
    }
  }

  const stale = "3260f08b-8fad-4bd8-be83-0c3966380c98";
  const { data: staleRow } = await db.from("listings").select("id").eq("id", stale).maybeSingle();
  console.log(`\nStale link ${stale}:`, staleRow ? "exists" : "DELETED (404 expected)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
