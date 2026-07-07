/**
 * Seed 10 pending listings for admin review testing.
 * Run: npm run db:seed-admin-review
 * Refresh existing demos: npm run db:seed-admin-review -- --refresh
 */

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "../src/lib/constants";
import { getAdminRegistryDisplay } from "../src/lib/admin/registry-display";
import { getListingApprovalChecklist } from "../src/lib/admin/listing-approval-checklist";
import { insertListingRow } from "../src/lib/listing-db-write";
import {
  columnExists,
  getSupabaseEnv,
  PORTAL_MIGRATION_FILES,
  readSql,
  runSqlViaPg,
} from "./db-env";

const SEED_TAG = "admin-review-demo";
const PHOTO_COUNT = MIN_LISTING_PHOTOS_FOR_REVIEW;
const REFRESH = process.argv.includes("--refresh");

const UNSPLASH_PHOTOS = [
  "photo-1502672260266-1c1ef2d93688",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1613490493576-7fde63acd811",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1493809842364-78817add7ffb",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-9143d071cb5c",
  "photo-1600585154340-be6161a56a0c",
  "photo-1600210492486-716fe82227fd",
  "photo-1586023492125-27b2c045efd7",
  "photo-1571059048253-8942b5c33461",
  "photo-1564013799919-ab600027ffc6",
  "photo-1512917774080-9991f1c4c750",
  "photo-1605276374109-8e413d1a8a7f",
  "photo-1615874959473-8f6085e8e726",
  "photo-1501183639438-63cb3756ed55",
  "photo-1570129477492-45c003edd2be",
  "photo-1600047509807-ba8f99d2a7a0",
  "photo-1616598222612-ef8299077817",
];

function unsplashUrl(id: string, w = 1200) {
  return `https://images.unsplash.com/${id}?w=${w}&q=85&auto=format`;
}

const HOSTS = [
  { name: "Γιώργος Παπαδόπουλος", phone: "+30 697 384 2156", email: "midora-host-1@midora-demo.local" },
  { name: "Μαρία Νικολάου", phone: "+30 694 521 7893", email: "midora-host-2@midora-demo.local" },
  { name: "Νίκος Αντωνίου", phone: "+30 693 847 1205", email: "midora-host-3@midora-demo.local" },
  { name: "Ελένη Δημητρίου", phone: "+30 698 234 5671", email: "midora-host-4@midora-demo.local" },
];

type DemoListing = {
  slug: string;
  title: string;
  description: string;
  city: string;
  area: string;
  street: string;
  number: string;
  postal: string;
  lat: number;
  lng: number;
  rental_type: "short_term" | "monthly";
  price_per_night?: number;
  price_monthly: number;
  accepts_under_60_days: boolean;
  legal_registry_type: "ama" | "esl" | "mag" | "none";
  ama_number: string | null;
  bedrooms: number;
  sqm: number;
  max_guests?: number;
  min_stay_label: string;
  property_type: string;
  photoOffset: number;
};

const DEMO_LISTINGS: DemoListing[] = [
  {
    slug: `${SEED_TAG}-01`,
    title: "Μοντέρνο διαμέρισμα Κολωνάκι",
    description:
      "Design διαμέρισμα 3ου ορόφου, ανακαινισμένο 2024. Designer επίπλωση, Nespresso, high-speed WiFi 500Mbps. Κοντά σε Βουλή & Σύνταγμα. Κλιματισμός, πλυντήριο, smart TV.",
    city: "Αθήνα",
    area: "Κολωνάκι",
    street: "Ιατριδου",
    number: "12",
    postal: "10675",
    lat: 37.9778,
    lng: 23.7418,
    rental_type: "short_term",
    price_per_night: 110,
    price_monthly: 1100,
    accepts_under_60_days: true,
    legal_registry_type: "ama",
    ama_number: "15976543897",
    bedrooms: 1,
    sqm: 58,
    max_guests: 2,
    min_stay_label: "2 νύχτες",
    property_type: "apartment",
    photoOffset: 0,
  },
  {
    slug: `${SEED_TAG}-02`,
    title: "Loft με θέα στην Ακρόπολη",
    description:
      "Ανακαινισμένο loft 5ου ορόφου με ανελκυστήρα. Πλήρως επιπλωμένο, smart TV, κλιματισμός, πλυντήριο. 5 λεπτά από σταθμό Συγγρού-Fix. Ιδανικό για expats & remote workers.",
    city: "Αθήνα",
    area: "Κουκάκι",
    street: "Ολυμπίου",
    number: "24",
    postal: "11742",
    lat: 37.9668,
    lng: 23.7281,
    rental_type: "short_term",
    price_per_night: 95,
    price_monthly: 850,
    accepts_under_60_days: true,
    legal_registry_type: "ama",
    ama_number: "12345678901",
    bedrooms: 2,
    sqm: 72,
    max_guests: 4,
    min_stay_label: "3 νύχτες",
    property_type: "apartment",
    photoOffset: 3,
  },
  {
    slug: `${SEED_TAG}-03`,
    title: "Penthouse με βεράντα & θέα θάλασσα",
    description:
      "Εξοχικό penthouse στη Γλυφάδα με 80τ.μ. βεράντα. 3 υ/δ, 2 μπάνια, parking, αποθήκη. Θέα στο Αιγαίο. Κοντά σε μαρίνα & εστιατόρια.",
    city: "Γλυφάδα",
    area: "Γλυφάδα",
    street: "Μεταξά",
    number: "45",
    postal: "16674",
    lat: 37.8625,
    lng: 23.7547,
    rental_type: "short_term",
    price_per_night: 145,
    price_monthly: 1450,
    accepts_under_60_days: true,
    legal_registry_type: "esl",
    ama_number: "ESL1234567890",
    bedrooms: 3,
    sqm: 95,
    max_guests: 6,
    min_stay_label: "4 νύχτες",
    property_type: "apartment",
    photoOffset: 6,
  },
  {
    slug: `${SEED_TAG}-04`,
    title: "Διαμέρισμα 2 υ/δ Εξάρχεια",
    description:
      "Ζεστό διαμέρισμα σε ήσυχη οδό, πλήρως επιπλωμένο. Κοντά σε μετρό Βικτώρια & πεζόδρομο. Ιδανικό για φοιτητές μεταπτυχιακούς.",
    city: "Αθήνα",
    area: "Εξάρχεια",
    street: "Ζωοδόχου Πηγής",
    number: "33",
    postal: "10681",
    lat: 37.9882,
    lng: 23.734,
    rental_type: "short_term",
    price_per_night: 75,
    price_monthly: 650,
    accepts_under_60_days: true,
    legal_registry_type: "mag",
    ama_number: "MAG7654321",
    bedrooms: 2,
    sqm: 65,
    max_guests: 3,
    min_stay_label: "2 νύχτες",
    property_type: "apartment",
    photoOffset: 9,
  },
  {
    slug: `${SEED_TAG}-05`,
    title: "Βίλα με κήπο Κηφισιά",
    description:
      "Ανεξάρτητη βίλα 180τ.μ. με κήπο 300τ.μ. 4 υ/δ, τζάκι, garage 2 αυτοκινήτων. Premium επιπλωμένη. Κοντά σε σχολεία & εμπορικό κέντρο.",
    city: "Κηφισιά",
    area: "Κηφισιά",
    street: "Κηφισίας",
    number: "120",
    postal: "14562",
    lat: 38.0742,
    lng: 23.8103,
    rental_type: "short_term",
    price_per_night: 220,
    price_monthly: 2200,
    accepts_under_60_days: true,
    legal_registry_type: "ama",
    ama_number: "98765432109",
    bedrooms: 4,
    sqm: 180,
    max_guests: 8,
    min_stay_label: "5 νύχτες",
    property_type: "house",
    photoOffset: 12,
  },
  {
    slug: `${SEED_TAG}-06`,
    title: "Loft Λαδάδικα — κέντρο Θεσσαλονίκης",
    description:
      "Stylish loft στο ιστορικό κέντρο. Exposed brick, fully furnished. Walking distance to waterfront & bars. High-speed WiFi, κλιματισμός.",
    city: "Θεσσαλονίκη",
    area: "Λαδάδικα",
    street: "Συντάγματος",
    number: "5",
    postal: "54625",
    lat: 40.6333,
    lng: 22.9417,
    rental_type: "short_term",
    price_per_night: 68,
    price_monthly: 620,
    accepts_under_60_days: true,
    legal_registry_type: "ama",
    ama_number: "11223344556",
    bedrooms: 1,
    sqm: 55,
    max_guests: 2,
    min_stay_label: "2 νύχτες",
    property_type: "apartment",
    photoOffset: 15,
  },
  {
    slug: `${SEED_TAG}-07`,
    title: "Διαμέρισμα 3 υ/δ Χαλάνδρι",
    description:
      "Οικογενειακό διαμέρισμα 120τ.μ. 3 υ/δ, 2 μπάνια, μπαλκόνια. Κοντά σε metro & εμπορικό. Parking included. Ιδανικό για μακροχρόνια διαμονή.",
    city: "Αθήνα",
    area: "Χαλάνδρι",
    street: "Πεντέλης",
    number: "18",
    postal: "15234",
    lat: 38.0214,
    lng: 23.7989,
    rental_type: "monthly",
    price_monthly: 950,
    accepts_under_60_days: false,
    legal_registry_type: "none",
    ama_number: null,
    bedrooms: 3,
    sqm: 120,
    min_stay_label: "3 μήνες",
    property_type: "apartment",
    photoOffset: 2,
  },
  {
    slug: `${SEED_TAG}-08`,
    title: "Ρετιρέ με θέα Λυκαβηττό",
    description:
      "Φωτεινό ρετιρέ στο Παγκράτι με πανοραμική θέα. 2 υ/δ, αυλή 40τ.μ., BBQ. Ήσυχη γειτονιά, 10 λεπτά περπάτημα από Καλλιμάρμορο.",
    city: "Αθήνα",
    area: "Παγκράτι",
    street: "Υμηττού",
    number: "22",
    postal: "11636",
    lat: 37.9681,
    lng: 23.7432,
    rental_type: "monthly",
    price_monthly: 780,
    accepts_under_60_days: false,
    legal_registry_type: "none",
    ama_number: null,
    bedrooms: 2,
    sqm: 78,
    min_stay_label: "2 μήνες",
    property_type: "apartment",
    photoOffset: 5,
  },
  {
    slug: `${SEED_TAG}-09`,
    title: "Sea view apartment Βούλα",
    description:
      "Διαμέρισμα 1ης γραμμής με θέα θάλασσα. 2 υ/δ, βεράντα 25τ.μ. Premium location, 5 min walk to beach. Δέχεται και κρατήσεις κάτω των 60 ημερών.",
    city: "Βούλα",
    area: "Βούλα",
    street: "Ακτής",
    number: "7",
    postal: "16673",
    lat: 37.8422,
    lng: 23.7756,
    rental_type: "monthly",
    price_monthly: 1200,
    accepts_under_60_days: true,
    legal_registry_type: "ama",
    ama_number: "55667788990",
    bedrooms: 2,
    sqm: 82,
    min_stay_label: "2 μήνες",
    property_type: "apartment",
    photoOffset: 8,
  },
  {
    slug: `${SEED_TAG}-10`,
    title: "Villa με πισίνα Χαλκιδική",
    description:
      "Private villa 150τ.μ. με κήπο και θέα θάλασσα. 3 υ/δ, BBQ, parking. Ιδανική για οικογένειες. Δέχεται κρατήσεις κάτω των 60 ημερών.",
    city: "Νέα Μουδανιά",
    area: "Χαλκιδική",
    street: "Παραλίας",
    number: "3",
    postal: "63200",
    lat: 40.2431,
    lng: 23.2847,
    rental_type: "monthly",
    price_monthly: 1400,
    accepts_under_60_days: true,
    legal_registry_type: "ama",
    ama_number: "66778899001",
    bedrooms: 3,
    sqm: 150,
    min_stay_label: "3 μήνες",
    property_type: "villa",
    photoOffset: 11,
  },
];

async function ensurePortalSchema(url: string, serviceKey: string) {
  if (await columnExists(url, serviceKey, "listings", "ama_number")) return;
  console.log("⏳ Portal columns missing — applying migrations...");
  const sql = PORTAL_MIGRATION_FILES.map((file) => readSql(file)).join("\n\n");
  await runSqlViaPg(sql);
}

async function ensureHosts(db: SupabaseClient) {
  const hostIds: string[] = [];

  for (let i = 0; i < HOSTS.length; i++) {
    const host = HOSTS[i];
    const { data: existingUsers } = await db.auth.admin.listUsers();
    const found = existingUsers?.users?.find((u) => u.email === host.email);

    if (found) {
      hostIds.push(found.id);
      await db.from("profiles").upsert({
        id: found.id,
        full_name: host.name,
        phone: host.phone,
        email: host.email,
        role: i === 0 ? "admin" : "user",
        allow_whatsapp: true,
        allow_viber: i % 2 === 0,
        allow_phone_contact: true,
      });
      continue;
    }

    const { data, error } = await db.auth.admin.createUser({
      email: host.email,
      password: `MidoraSeed!${i + 1}${Date.now()}`,
      email_confirm: true,
      user_metadata: { full_name: host.name, phone: host.phone },
    });

    if (error || !data.user) {
      console.error(`  ✗ Host ${host.email}:`, error?.message);
      continue;
    }

    hostIds.push(data.user.id);
    await db.from("profiles").upsert({
      id: data.user.id,
      full_name: host.name,
      phone: host.phone,
      email: host.email,
      role: i === 0 ? "admin" : "user",
      allow_whatsapp: true,
      allow_viber: i % 2 === 0,
      allow_phone_contact: true,
    });
  }

  return hostIds;
}

function buildAddress(d: DemoListing): string {
  return `${d.street} ${d.number}, ${d.postal}, ${d.area}, ${d.city}`;
}

function photoUrls(offset: number): string[] {
  return Array.from({ length: PHOTO_COUNT }, (_, i) =>
    unsplashUrl(UNSPLASH_PHOTOS[(offset + i) % UNSPLASH_PHOTOS.length])
  );
}

async function insertPhotos(
  db: SupabaseClient,
  listingId: string,
  ownerId: string,
  urls: string[]
) {
  const rows = urls.map((url, i) => ({
    listing_id: listingId,
    url,
    sort_order: i,
    media_type: "image",
    owner_id: ownerId,
    is_cover: i === 0,
    file_name: `property-${i + 1}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: 250000,
  }));

  const full = await db.from("listing_images").insert(rows);
  if (!full.error) return;

  const minimal = rows.map(({ listing_id, url, sort_order }) => ({
    listing_id,
    url,
    sort_order,
  }));
  const { error } = await db.from("listing_images").insert(minimal);
  if (error) throw new Error(`Photos insert failed: ${error.message}`);
}

async function deleteDemoListing(db: SupabaseClient, listingId: string) {
  await db.from("listing_images").delete().eq("listing_id", listingId);
  await db.from("listings").delete().eq("id", listingId);
}

async function main() {
  console.log("\n🏠 Midora — seed 10 admin review listings\n");
  if (REFRESH) console.log("♻️  Refresh mode — replacing existing demo listings\n");

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase env in .env.local");
    process.exit(1);
  }

  try {
    await ensurePortalSchema(url, serviceKey);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_db_password") {
      console.error("❌ Portal schema missing — run apply-portal-minimal.sql in Supabase first");
      process.exit(1);
    }
    throw error;
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const hostIds = await ensureHosts(db);
  if (!hostIds.length) {
    console.error("❌ No hosts available");
    process.exit(1);
  }

  const created: { id: string; title: string; slug: string }[] = [];

  for (let i = 0; i < DEMO_LISTINGS.length; i++) {
    const demo = DEMO_LISTINGS[i];
    const hostId = hostIds[i % hostIds.length];
    const urls = photoUrls(demo.photoOffset);

    const { data: existing } = await db
      .from("listings")
      .select("id, title")
      .eq("slug", demo.slug)
      .maybeSingle();

    if (existing) {
      if (REFRESH) {
        await deleteDemoListing(db, existing.id);
        console.log(`  ♻️  Replaced: ${demo.title}`);
      } else {
        await db.from("listing_images").delete().eq("listing_id", existing.id);
        await db
          .from("listings")
          .update({
            title: demo.title,
            description: demo.description,
            city: demo.city,
            area: demo.area,
            address: buildAddress(demo),
            address_street: demo.street,
            address_number: demo.number,
            address_postal_code: demo.postal,
            latitude: demo.lat,
            longitude: demo.lng,
            property_type: demo.property_type,
            rental_type: demo.rental_type,
            price_type: demo.rental_type === "short_term" ? "per_night" : "per_month",
            price_monthly: demo.price_monthly,
            price_per_night: demo.price_per_night ?? null,
            bedrooms: demo.bedrooms,
            sqm: demo.sqm,
            max_guests: demo.max_guests ?? null,
            min_stay_label: demo.min_stay_label,
            ama_number: demo.ama_number,
            legal_registry_type: demo.legal_registry_type,
            accepts_under_60_days: demo.accepts_under_60_days,
          })
          .eq("id", existing.id);
        await insertPhotos(db, existing.id, hostId, urls);
        console.log(`  ↻ Updated photos: ${demo.title}`);
        created.push({ id: existing.id, title: demo.title, slug: demo.slug });
        continue;
      }
    }

    const row = {
      slug: demo.slug,
      user_id: hostId,
      title: demo.title,
      description: demo.description,
      city: demo.city,
      area: demo.area,
      address: buildAddress(demo),
      address_street: demo.street,
      address_number: demo.number,
      address_postal_code: demo.postal,
      latitude: demo.lat,
      longitude: demo.lng,
      rental_type: demo.rental_type,
      price_type: demo.rental_type === "short_term" ? "per_night" : "per_month",
      price_monthly: demo.price_monthly,
      price_per_night: demo.price_per_night ?? null,
      included_guests: demo.rental_type === "short_term" ? 2 : null,
      extra_guest_fee_per_night: demo.rental_type === "short_term" ? 15 : null,
      bedrooms: demo.bedrooms,
      bathrooms: 1,
      sqm: demo.sqm,
      max_guests: demo.max_guests ?? null,
      min_months: demo.rental_type === "monthly" ? 2 : 1,
      min_stay_label: demo.min_stay_label,
      furnished: true,
      utilities_included: demo.rental_type === "short_term",
      property_type: demo.property_type,
      ama_number: demo.ama_number,
      legal_registry_type: demo.legal_registry_type,
      accepts_under_60_days: demo.accepts_under_60_days,
      ama_declaration_accepted: Boolean(demo.ama_number),
      owner_responsibility_accepted: true,
      platform_role_accepted: true,
      contact_name: HOSTS[i % HOSTS.length].name,
      contact_phone: HOSTS[i % HOSTS.length].phone,
      contact_email: HOSTS[i % HOSTS.length].email,
      preferred_contact: "message",
      allow_phone_contact: true,
      allow_whatsapp: demo.rental_type === "short_term",
      allow_viber: demo.rental_type === "short_term" && i % 2 === 0,
      allow_message: true,
      availability_status: "available_now",
      status: "pending",
      approval_status: "pending_review",
      advertiser_verification_status: "not_started",
      property_verification_status: "pending",
      midora_verification_code: randomUUID().slice(0, 8).toUpperCase(),
    };

    const { data: inserted, error } = await insertListingRow(db, row, hostId);

    if (error || !inserted?.id) {
      console.error(`  ✗ ${demo.slug}:`, error?.message);
      continue;
    }

    await insertPhotos(db, inserted.id, hostId, urls);

    const { data: withImages } = await db
      .from("listings")
      .select("*, listing_images(id, media_type)")
      .eq("id", inserted.id)
      .single();

    const registry = getAdminRegistryDisplay(withImages ?? row);
    const checklist = await getListingApprovalChecklist(
      db,
      (withImages ?? { ...row, id: inserted.id, listing_images: [] }) as never
    );

    console.log(`  ✓ ${demo.title}`);
    console.log(`    id: ${inserted.id}`);
    console.log(`    registry: [${registry.kind}] ${registry.text}`);
    console.log(`    canApprove: ${checklist.canApprove}`);

    created.push({ id: inserted.id, title: demo.title, slug: demo.slug });
  }

  console.log(`\n✅ ${created.length} listings ready for admin review`);
  console.log("\n📋 http://localhost:3000/admin/listings/review\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
