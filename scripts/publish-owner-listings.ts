/**
 * Approve/publish all listings for an owner (admin bypass via service role).
 * Run: npx tsx scripts/publish-owner-listings.ts --email=thelwtothlefwnosou@gmail.com
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, loadEnv } from "./db-env";

function parseArg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function main() {
  loadEnv();
  const email = parseArg("email") ?? "thelwtothlefwnosou@gmail.com";
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase env");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authUsers, error: authError } = await db.auth.admin.listUsers({
    perPage: 500,
  });
  if (authError) throw new Error(authError.message);

  const user = authUsers.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) throw new Error(`No auth user for: ${email}`);

  const { data: listings, error: listError } = await db
    .from("listings")
    .select("id, title, slug, rental_type, status, approval_status, is_hidden, published_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (listError) throw new Error(listError.message);
  if (!listings?.length) throw new Error(`No listings for ${email}`);

  console.log(`\n📌 Publish listings for ${email}\n`);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 2);
  const now = new Date().toISOString();

  for (const listing of listings) {
    const alreadyPublished =
      listing.status === "approved" &&
      listing.approval_status === "approved" &&
      !listing.is_hidden;

    if (alreadyPublished) {
      console.log(`✅ Already published: ${listing.title} (${listing.id})`);
      continue;
    }

    const { error: updateError } = await db
      .from("listings")
      .update({
        status: "approved",
        approval_status: "approved",
        is_hidden: false,
        published_at: listing.published_at ?? now,
        expires_at: expiresAt.toISOString(),
        advertiser_verification_status: "verified",
        property_verification_status: "verified",
      })
      .eq("id", listing.id);

    if (updateError) throw new Error(`${listing.title}: ${updateError.message}`);

    console.log(`✅ Published: ${listing.title}`);
    console.log(`   ID:   ${listing.id}`);
    console.log(`   Type: ${listing.rental_type}`);
    console.log(`   URL:  http://localhost:3000/listings/${listing.slug ?? listing.id}`);
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
