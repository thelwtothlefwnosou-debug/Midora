/**
 * Create a short-term listing for an owner, matching their monthly listing's dashboard state.
 * Run: npx tsx scripts/seed-owner-short-term-from-monthly.ts --email=thelwtothlefwnosou@gmail.com
 */

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { insertListingRow } from "../src/lib/listing-db-write";
import { getSupabaseEnv, loadEnv } from "./db-env";

loadEnv();

const SEED_SLUG = "owner-short-term-thessaloniki";

function parseArg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function main() {
  const email = parseArg("email") ?? "thelwtothlefwnosou@gmail.com";
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env in .env.local");
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
  if (!user) throw new Error(`No auth user for email: ${email}`);

  const { data: monthly, error: monthlyError } = await db
    .from("listings")
    .select("*, listing_images(*)")
    .eq("user_id", user.id)
    .eq("rental_type", "monthly")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (monthlyError) throw new Error(monthlyError.message);
  if (!monthly) throw new Error(`No monthly listing found for ${email}`);

  const { data: existing } = await db
    .from("listings")
    .select("id, title")
    .eq("slug", SEED_SLUG)
    .maybeSingle();

  if (existing) {
    await db.from("listing_unavailable_periods").delete().eq("listing_id", existing.id);
    await db.from("listing_images").delete().eq("listing_id", existing.id);
    await db.from("listings").delete().eq("id", existing.id);
    console.log(`Removed previous short-term listing: ${existing.title}`);
  }

  const listingId = randomUUID();
  const now = new Date().toISOString();
  const expiresAt = monthly.expires_at ?? new Date(Date.now() + 60 * 86400000).toISOString();

  const row = {
    id: listingId,
    slug: SEED_SLUG,
    user_id: user.id,
    title: "Διαμέρισμα βραχυχρόνιας μίσθωσης — Θεσσαλονίκη",
    description:
      "Φωτεινό διαμέρισμα 2 υπνοδωματίων στη Θεσσαλονίκη, ιδανικό για βραχυχρόνια διαμονή. Πλήρως επιπλωμένο, κοντά σε μεταφορικά και κέντρο. Διαθέσιμο για διαμονές από 2 νύχτες.",
    city: monthly.city,
    area: monthly.area,
    address: monthly.address,
    address_street: monthly.address_street,
    address_number: monthly.address_number,
    address_postal_code: monthly.address_postal_code,
    latitude: monthly.latitude,
    longitude: monthly.longitude,
    location_confirmed_by_owner: monthly.location_confirmed_by_owner ?? true,
    location_confirmed_at: monthly.location_confirmed_at ?? now,
    rental_type: "short_term",
    supports_short_term: true,
    supports_monthly: false,
    price_type: "per_night",
    price_per_night: 55,
    price_monthly: 794,
    included_guests: 2,
    extra_guest_fee_per_night: 10,
    max_guests: 4,
    minimum_stay_nights: 2,
    min_stay_label: "2 νύχτες",
    bedrooms: monthly.bedrooms,
    bathrooms: monthly.bathrooms ?? 1,
    sqm: monthly.sqm,
    floor: monthly.floor,
    furnished: monthly.furnished,
    utilities_included: true,
    property_type: monthly.property_type,
    ama_number: "00009876543",
    legal_registry_type: "ama",
    accepts_under_60_days: true,
    ama_declaration_accepted: true,
    availability_status: monthly.availability_status ?? "available_now",
    owner_responsibility_accepted: monthly.owner_responsibility_accepted,
    platform_role_accepted: monthly.platform_role_accepted,
    terms_privacy_accepted: true,
    declarations_submitted_at: now,
    contact_name: monthly.contact_name,
    contact_phone: monthly.contact_phone,
    contact_email: monthly.contact_email ?? email,
    preferred_contact: monthly.preferred_contact,
    allow_phone_contact: monthly.allow_phone_contact ?? true,
    allow_whatsapp: monthly.allow_whatsapp ?? true,
    allow_message: monthly.allow_message ?? true,
    advertiser_verification_status: monthly.advertiser_verification_status ?? "verified",
    property_verification_status: monthly.property_verification_status ?? "verified",
    status: monthly.status,
    approval_status: monthly.approval_status,
    published_at: null,
    expires_at: expiresAt,
    is_hidden: false,
    view_count: 0,
  };

  const { error: insertError } = await insertListingRow(db, row);
  if (insertError) throw new Error(insertError.message);

  const images = (monthly.listing_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  if (images.length > 0) {
    const photoRows = images.map(
      (
        img: {
          url: string;
          sort_order: number;
          media_type: string;
          is_cover: boolean;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          storage_path: string | null;
        },
        i: number
      ) => ({
        listing_id: listingId,
        url: img.url,
        sort_order: i,
        media_type: img.media_type ?? "image",
        owner_id: user.id,
        is_cover: i === 0,
        file_name: img.file_name,
        mime_type: img.mime_type,
        size_bytes: img.size_bytes,
        storage_path: img.storage_path,
      })
    );

    const { error: photosError } = await db.from("listing_images").insert(photoRows);
    if (photosError) throw new Error(photosError.message);
  }

  console.log("\nShort-term listing created (matches monthly dashboard state):");
  console.log(`  Owner:  ${email}`);
  console.log(`  ID:     ${listingId}`);
  console.log(`  Status: ${row.status} / ${row.approval_status}`);
  console.log(`  Photos: ${images.length}`);
  console.log(`  Edit:   http://localhost:3000/dashboard/listings/${listingId}/edit`);
  console.log(`  List:   http://localhost:3000/dashboard/listings`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
