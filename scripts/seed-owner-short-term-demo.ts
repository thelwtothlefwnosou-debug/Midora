/**
 * Create a short-term listing for the logged-in owner (by profile name/email).
 * Run: npx tsx scripts/seed-owner-short-term-demo.ts
 * Or:  npx tsx scripts/seed-owner-short-term-demo.ts --email=user@example.com
 */

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "../src/lib/constants";
import { insertListingRow } from "../src/lib/listing-db-write";
import { getSupabaseEnv, loadEnv } from "./db-env";

loadEnv();

const SEED_SLUG = "owner-demo-short-term";
const PHOTOS = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=85&auto=format",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85&auto=format",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=85&auto=format",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=85&auto=format",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85&auto=format",
];

function parseArg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function findOwnerId(
  db: ReturnType<typeof createClient>,
  email?: string
): Promise<{ id: string; full_name: string | null; email: string | null }> {
  if (email) {
    const { data: authUsers, error } = await db.auth.admin.listUsers({ perPage: 500 });
    if (error) throw new Error(error.message);
    const user = authUsers.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!user) throw new Error(`No auth user for email: ${email}`);
    const { data: profile } = await db
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle();
    return {
      id: user.id,
      full_name: profile?.full_name ?? null,
      email: user.email ?? null,
    };
  }

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, full_name")
    .limit(100);

  if (error) throw new Error(error.message);

  const match =
    profiles?.find((p) =>
      /vaggelis|vagelis|psarras/i.test(p.full_name ?? "")
    ) ??
    profiles?.find((p) => p.full_name && !/Παπαδόπουλος|Νικολάου|Αντωνίου/i.test(p.full_name)) ??
    profiles?.[0];

  if (!match) throw new Error("No profiles found");

  const { data: authUser } = await db.auth.admin.getUserById(match.id);

  return {
    id: match.id,
    full_name: match.full_name,
    email: authUser.user?.email ?? null,
  };
}

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env in .env.local");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const emailArg = parseArg("email");
  const owner = await findOwnerId(db, emailArg);
  console.log(`Owner: ${owner.full_name ?? owner.id} (${owner.email ?? "no email"})`);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 2);

  const { data: existing } = await db
    .from("listings")
    .select("id, title")
    .eq("slug", SEED_SLUG)
    .maybeSingle();

  if (existing) {
    await db.from("listing_unavailable_periods").delete().eq("listing_id", existing.id);
    await db.from("listing_images").delete().eq("listing_id", existing.id);
    await db.from("listings").delete().eq("id", existing.id);
    console.log(`Removed previous demo: ${existing.title}`);
  }

  const listingId = randomUUID();
  const now = new Date().toISOString();

  const row = {
    id: listingId,
    slug: SEED_SLUG,
    user_id: owner.id,
    title: "Βραχυχρόνιο studio Πλάκα — demo διαθεσιμότητας",
    description:
      "Φωτεινό studio 45τ.μ. στην Πλάκα για βραχυχρόνια διαμονή. WiFi, A/C, πλήρως εξοπλισμένη κουζίνα. Ιδανικό για city break 2–7 νύχτες. Demo αγγελία για δοκιμή ημερολογίου διαθεσιμότητας.",
    city: "Αθήνα",
    area: "Πλάκα",
    city_display_name: "Αθήνα",
    area_display_name: "Πλάκα",
    address: "Μνησικλέους 8, Αθήνα",
    address_street: "Μνησικλέους",
    address_number: "8",
    address_postal_code: "10556",
    formatted_address: "Μνησικλέους 8, Πλάκα, Αθήνα 10556",
    latitude: 37.9715,
    longitude: 23.7267,
    location_confirmed_by_owner: true,
    location_confirmed_at: now,
    rental_type: "short_term",
    supports_short_term: true,
    supports_monthly: false,
    price_type: "per_night",
    price_per_night: 65,
    price_monthly: 1200,
    included_guests: 2,
    extra_guest_fee_per_night: 12,
    max_guests: 3,
    minimum_stay_nights: 2,
    min_stay_label: "2 νύχτες",
    bedrooms: 1,
    bathrooms: 1,
    sqm: 45,
    floor: 2,
    furnished: true,
    utilities_included: true,
    property_type: "studio",
    ama_number: "00001234567",
    legal_registry_type: "ama",
    accepts_under_60_days: true,
    ama_declaration_accepted: true,
    availability_status: "available_now",
    owner_responsibility_accepted: true,
    platform_role_accepted: true,
    terms_privacy_accepted: true,
    declarations_submitted_at: now,
    contact_name: owner.full_name ?? "Ιδιοκτήτης",
    allow_phone_contact: true,
    allow_whatsapp: true,
    allow_message: true,
    status: "approved",
    approval_status: "approved",
    published_at: now,
    expires_at: expiresAt.toISOString(),
    is_hidden: false,
    view_count: 42,
  };

  const { error: insertError } = await insertListingRow(db, row);
  if (insertError) throw new Error(insertError.message);

  const photoRows = PHOTOS.map((photoUrl, i) => ({
    listing_id: listingId,
    url: photoUrl,
    sort_order: i,
    media_type: "image",
    owner_id: owner.id,
    is_cover: i === 0,
    file_name: `demo-${i + 1}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: 240000,
  }));

  const { error: photosError } = await db.from("listing_images").insert(photoRows);
  if (photosError) {
    const minimal = photoRows.map(({ listing_id, url, sort_order }) => ({
      listing_id,
      url,
      sort_order,
    }));
    const { error: minimalError } = await db.from("listing_images").insert(minimal);
    if (minimalError) throw new Error(minimalError.message);
  }

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const blockedStart = new Date(today);
  blockedStart.setDate(blockedStart.getDate() + 10);
  const blockedEnd = new Date(blockedStart);
  blockedEnd.setDate(blockedEnd.getDate() + 4);

  const blockedStart2 = new Date(today);
  blockedStart2.setDate(blockedStart2.getDate() + 20);
  const blockedEnd2 = new Date(blockedStart2);
  blockedEnd2.setDate(blockedEnd2.getDate() + 2);

  const periods = [
    {
      listing_id: listingId,
      owner_id: owner.id,
      start_date: fmt(blockedStart),
      end_date: fmt(blockedEnd),
      reason: "unavailable",
      note: "Κράτηση επισκέπτη",
    },
    {
      listing_id: listingId,
      owner_id: owner.id,
      start_date: fmt(blockedStart2),
      end_date: fmt(blockedEnd2),
      reason: "personal_use",
      note: "Ιδιωτική χρήση",
    },
  ];

  const { error: periodsError } = await db.from("listing_unavailable_periods").insert(periods);
  if (periodsError) {
    console.warn("Unavailable periods skipped:", periodsError.message);
  }

  console.log("\nShort-term demo listing created:");
  console.log(`  ID:    ${listingId}`);
  console.log(`  Slug:  ${SEED_SLUG}`);
  console.log(`  Edit:  http://localhost:3000/dashboard/listings/${listingId}/edit`);
  console.log(`  List:  http://localhost:3000/dashboard/listings`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
