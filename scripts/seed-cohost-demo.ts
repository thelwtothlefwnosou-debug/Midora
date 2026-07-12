/**
 * Demo: public co-host profile with 2 co-managed listings.
 * Run: npx tsx scripts/seed-cohost-demo.ts
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getPgConnectionString, loadEnv, readSql, runSqlViaPg } from "./db-env";

const COHOST = {
  email: "maria-cohost@midora-demo.local",
  password: "MidoraDemo2026!",
  fullName: "Μαρία Κωνσταντίνου",
  displayName: "Μαρία Κ.",
  publicSlug: "maria-konstantinou",
  bio: "Διαχειρίζομαι ακίνητα βραχυχρόνιας και μηνιαίας μίσθωσης στην Αθήνα και τη Θεσσαλονίκη. Απαντώ γρήγορα σε αιτήματα διαθεσιμότητας μέσω Midora.",
  businessTitle: "Διαχειριστής ακινήτων",
};

/** Showcase listing — co-host appears on public listing page */
const SHOWCASE_LISTING_SLUG = "owner-showcase-short-term-plaka";

/** Second listing for public profile (different owner) */
const SECOND_LISTING_SLUG = "owner-short-term-thessaloniki";

const SCHEMA_FILES = [
  "supabase/migrations/20250615130000_property_leads.sql",
  "supabase/migrations/20250712150000_listing_cohosts.sql",
  "supabase/migrations/20250712180000_profile_public_slug.sql",
] as const;

async function ensureSchema() {
  loadEnv();
  const connectionString = getPgConnectionString();
  if (!connectionString) {
    console.error("❌ Missing SUPABASE_DB_PASSWORD in .env.local");
    process.exit(1);
  }

  for (const file of SCHEMA_FILES) {
    try {
      console.log(`⏳ ${file}`);
      await runSqlViaPg(readSql(file));
      console.log(`✅ ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("already exists") ||
        message.includes("duplicate key") ||
        message.includes("IF NOT EXISTS")
      ) {
        console.log(`⚠️  ${file} — skipped (already applied)`);
        continue;
      }
      console.error(`❌ ${file}\n   ${message}`);
      process.exit(1);
    }
  }
}

async function main() {
  await ensureSchema();

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n🏠 Midora — seed co-host demo profile\n");

  // Ensure co-host auth user
  let cohostUserId: string | null = null;
  const { data: usersPage } = await db.auth.admin.listUsers({ perPage: 200 });
  const existingUser = usersPage?.users?.find((u) => u.email === COHOST.email);

  if (existingUser) {
    cohostUserId = existingUser.id;
    console.log(`✓ Co-host user exists (${COHOST.email})`);
  } else {
    const { data: created, error } = await db.auth.admin.createUser({
      email: COHOST.email,
      password: COHOST.password,
      email_confirm: true,
      user_metadata: { full_name: COHOST.fullName, display_name: COHOST.displayName },
    });
    if (error || !created.user) {
      console.error("❌ createUser:", error?.message);
      process.exit(1);
    }
    cohostUserId = created.user.id;
    console.log(`✓ Created co-host user (${COHOST.email})`);
  }

  const profileRow: Record<string, unknown> = {
    id: cohostUserId,
    full_name: COHOST.fullName,
    display_name: COHOST.displayName,
    phone: "+30 694 882 1045",
    bio: COHOST.bio,
    advertiser_type: "professional",
    business_title: COHOST.businessTitle,
    communication_languages: ["el", "en"],
    public_slug: COHOST.publicSlug,
    public_profile_enabled: true,
    show_owned_listings_on_profile: true,
    show_cohosted_listings_on_profile: true,
    role: "user",
  };

  let { error: profileError } = await db.from("profiles").upsert(profileRow);
  if (profileError?.message.includes("show_profile_photo_public")) {
    delete profileRow.show_profile_photo_public;
    ({ error: profileError } = await db.from("profiles").upsert(profileRow));
  }
  if (profileError?.message.includes("public_slug")) {
    for (const key of [
      "public_slug",
      "public_profile_enabled",
      "show_owned_listings_on_profile",
      "show_cohosted_listings_on_profile",
    ]) {
      delete profileRow[key];
    }
    ({ error: profileError } = await db.from("profiles").upsert(profileRow));
  }
  if (profileError) {
    console.error("❌ profile upsert:", profileError.message);
    process.exit(1);
  }
  console.log(`✓ Profile ready — /users/${COHOST.publicSlug}`);

  const slugs = [SHOWCASE_LISTING_SLUG, SECOND_LISTING_SLUG];
  const { data: listings, error: listingsError } = await db
    .from("listings")
    .select("id, title, slug, user_id, status, is_hidden")
    .in("slug", slugs);

  if (listingsError || !listings?.length) {
    console.error("❌ listings:", listingsError?.message ?? "not found");
    process.exit(1);
  }

  const bySlug = new Map(listings.map((l) => [l.slug, l]));
  for (const slug of slugs) {
    if (!bySlug.has(slug)) {
      console.error(`❌ Listing not found: ${slug}`);
      process.exit(1);
    }
  }

  for (const slug of slugs) {
    const listing = bySlug.get(slug)!;
    if (listing.user_id === cohostUserId) {
      console.error(`❌ Co-host cannot be owner of ${slug}`);
      process.exit(1);
    }

    const { data: existingCohost } = await db
      .from("listing_cohosts")
      .select("id, status")
      .eq("listing_id", listing.id)
      .eq("invited_email", COHOST.email)
      .maybeSingle();

    if (existingCohost?.status === "accepted") {
      console.log(`✓ Already co-host on: ${listing.title}`);
      continue;
    }

    if (existingCohost) {
      const { error } = await db
        .from("listing_cohosts")
        .update({
          status: "accepted",
          cohost_user_id: cohostUserId,
          accepted_at: new Date().toISOString(),
          permission_level: "messages_availability",
          can_manage_listing: false,
          can_manage_photos: false,
          can_manage_availability: true,
          can_manage_pricing: false,
          can_manage_messages: true,
          can_view_stats: true,
          can_manage_cohosts: false,
        })
        .eq("id", existingCohost.id);
      if (error) {
        console.error(`❌ update cohost ${slug}:`, error.message);
        process.exit(1);
      }
      console.log(`✓ Reactivated co-host on: ${listing.title}`);
      continue;
    }

    const { error } = await db.from("listing_cohosts").insert({
      listing_id: listing.id,
      owner_user_id: listing.user_id,
      cohost_user_id: cohostUserId,
      invited_email: COHOST.email,
      invited_name: COHOST.fullName,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      permission_level: "messages_availability",
      can_manage_listing: false,
      can_manage_photos: false,
      can_manage_availability: true,
      can_manage_pricing: false,
      can_manage_messages: true,
      can_view_stats: true,
      can_manage_cohosts: false,
    });
    if (error) {
      console.error(`❌ insert cohost ${slug}:`, error.message);
      process.exit(1);
    }
    console.log(`✓ Co-host added on: ${listing.title}`);
  }

  console.log("\n✅ Demo ready:\n");
  console.log(`   Public profile:  http://localhost:3000/users/${COHOST.publicSlug}`);
  console.log(`   Listing (Πλάκα): http://localhost:3000/listings/${SHOWCASE_LISTING_SLUG}`);
  console.log(`   Listing (Θεσσ.): http://localhost:3000/listings/${SECOND_LISTING_SLUG}`);
  console.log(`   Co-host login:   ${COHOST.email} / ${COHOST.password}\n`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
