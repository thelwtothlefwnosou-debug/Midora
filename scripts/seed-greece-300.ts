/**
 * Seed 300 ακίνητα σε ηπειρωτική Ελλάδα με πραγματικές φωτογραφίες (Pexels).
 * Όχι Spitogatos / scraping.
 *
 * Run:
 *   npm run db:seed-greece-300
 *   npm run db:seed-greece-300 -- --refresh
 *   npm run db:seed-greece-300 -- --limit=20
 *   npm run db:seed-greece-300 -- --replace-demo   # αφαιρεί τις παλιές seed-* Unsplash
 */

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "../src/lib/constants";
import { insertListingRow } from "../src/lib/listing-db-write";
import { insertListingImageAfterUpload } from "../src/lib/listing-image-db";
import {
  columnExists,
  getSupabaseEnv,
  PORTAL_MIGRATION_FILES,
  readSql,
  runSqlViaPg,
  loadEnv,
} from "./db-env";
import { generateGreeceListings } from "./greece-rentals/generate-listings";
import type { GeneratedGreeceListing } from "./greece-rentals/generate-listings";

const SEED_TAG = "greece-rental";
const PHOTO_COUNT = Math.max(MIN_LISTING_PHOTOS_FOR_REVIEW, 6);
const REFRESH = process.argv.includes("--refresh");
const REPLACE_DEMO = process.argv.includes("--replace-demo");
const DRY_RUN = process.argv.includes("--dry-run");

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit?.slice(flag.length + 1);
}

const HOSTS = Array.from({ length: 30 }, (_, i) => ({
  name: [
    "Γιώργος Παπαδόπουλος",
    "Μαρία Νικολάου",
    "Νίκος Αντωνίου",
    "Ελένη Δημητρίου",
    "Κώστας Γεωργίου",
    "Σοφία Παπαδοπούλου",
    "Δημήτρης Ιωάννου",
    "Αννα Μιχαηλίδου",
    "Παύλος Κωνσταντίνου",
    "Χριστίνα Βασιλείου",
    "Αλέξανδρος Στεφάνου",
    "Ιωάννα Φωτιάδου",
    "Μιχάλης Οικονόμου",
    "Κατερίνα Αλεξίου",
    "Θανάσης Πέτρου",
    "Ευαγγελία Σωτηρίου",
    "Πέτρος Χριστοδούλου",
    "Δέσποινα Αργυρού",
    "Βασίλης Μακρής",
    "Φωτεινή Καραγιάννη",
    "Στέφανος Παπανίκου",
    "Όλγα Δούκα",
    "Αντώνης Λαζαρίδης",
    "Μαρίνα Τσακίρη",
    "Γιάννης Στεργίου",
    "Βικτώρια Αθανασίου",
    "Χρήστος Παπαϊωάννου",
    "Ειρήνη Νικολέτου",
    "Λεωνίδας Σαββίδης",
    "Αγγελική Μπακογιάννη",
  ][i % 30],
  phone: `+30 69${String(700000000 + i * 1234567).slice(0, 8)}`,
  email: `midora-host-${i + 1}@midora-demo.local`,
}));

async function ensurePortalSchema(url: string, serviceKey: string) {
  if (await columnExists(url, serviceKey, "listings", "ama_number")) return;
  console.log("⏳ Portal columns missing — applying migrations...");
  const sql = PORTAL_MIGRATION_FILES.map((file) => readSql(file)).join("\n\n");
  await runSqlViaPg(sql);
}

async function ensureHosts(db: SupabaseClient): Promise<string[]> {
  const hostIds: string[] = [];
  const { data: existingUsers } = await db.auth.admin.listUsers({ perPage: 500 });
  const users = existingUsers?.users ?? [];

  for (let i = 0; i < HOSTS.length; i++) {
    const host = HOSTS[i];
    const found = users.find((u) => u.email === host.email);
    if (found) {
      hostIds.push(found.id);
      await db.from("profiles").upsert({
        id: found.id,
        full_name: host.name,
        phone: host.phone,
        email: host.email,
        role: "user",
        allow_phone_contact: true,
        allow_whatsapp: true,
        primary_phone_verified_at: new Date().toISOString(),
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
      console.warn(`  ⚠ Host ${host.email}: ${error?.message}`);
      continue;
    }
    hostIds.push(data.user.id);
    await db.from("profiles").upsert({
      id: data.user.id,
      full_name: host.name,
      phone: host.phone,
      email: host.email,
      role: "user",
      allow_phone_contact: true,
      allow_whatsapp: true,
      primary_phone_verified_at: new Date().toISOString(),
    });
  }
  return hostIds;
}

function buildAddress(item: GeneratedGreeceListing): string {
  return `${item.street} ${item.number}, ${item.postal}, ${item.area}, ${item.city}`;
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MidoraSeed/1.0)", Accept: "image/*" },
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const ab = await res.arrayBuffer();
    if (ab.byteLength < 5_000) return null;
    return { buffer: Buffer.from(ab), mime };
  } catch {
    return null;
  }
}

async function mirrorPhotos(
  db: SupabaseClient,
  listingId: string,
  ownerId: string,
  urls: string[]
): Promise<number> {
  let uploaded = 0;
  for (let i = 0; i < urls.slice(0, PHOTO_COUNT).length; i++) {
    const downloaded = await downloadImage(urls[i]);
    if (!downloaded) continue;

    const ext = downloaded.mime.includes("png") ? "png" : "jpg";
    const fileId = randomUUID();
    const storagePath = `${ownerId}/${listingId}/${fileId}.${ext}`;

    const { error: storageError } = await db.storage
      .from("listing-photos")
      .upload(storagePath, downloaded.buffer, {
        contentType: downloaded.mime,
        upsert: false,
      });
    if (storageError) continue;

    const {
      data: { publicUrl },
    } = db.storage.from("listing-photos").getPublicUrl(storagePath);

    const inserted = await insertListingImageAfterUpload(
      db,
      { listing_id: listingId, url: publicUrl, sort_order: uploaded, media_type: "image" },
      {
        owner_id: ownerId,
        storage_path: storagePath,
        is_cover: uploaded === 0,
        file_name: `pexels-${i + 1}.${ext}`,
        mime_type: downloaded.mime,
        size_bytes: downloaded.buffer.length,
      }
    );
    if (!inserted.error) uploaded++;
  }
  return uploaded;
}

async function deleteBySlugPrefix(db: SupabaseClient, prefix: string) {
  const { data: rows } = await db.from("listings").select("id").like("slug", `${prefix}%`);
  for (const row of rows ?? []) {
    await db.from("listing_images").delete().eq("listing_id", row.id);
    await db.from("listings").delete().eq("id", row.id);
  }
  console.log(`♻️  Διαγράφηκαν ${rows?.length ?? 0} αγγελίες (${prefix}*)`);
}

async function main() {
  loadEnv();
  const limit = parseInt(argValue("--limit") ?? "300", 10);

  console.log("\n🏠 Midora — seed 300 ακίνητα (Pexels, ηπειρωτική Ελλάδα)\n");
  if (DRY_RUN) console.log("🔍 Dry-run\n");

  const listings = await generateGreeceListings(limit);
  console.log(`📋 Προετοιμάστηκαν ${listings.length} αγγελίες`);
  console.log(`   Με ΑΜΑ: ${listings.filter((l) => l.withAma).length}`);
  console.log(`   Χωρίς ΑΜΑ: ${listings.filter((l) => !l.withAma).length}\n`);

  if (DRY_RUN) return;

  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase env in .env.local");
    process.exit(1);
  }

  try {
    await ensurePortalSchema(url, serviceKey);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_db_password") {
      console.error("❌ Portal schema missing — run db:migrate-portal first");
      process.exit(1);
    }
    throw error;
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (REPLACE_DEMO) await deleteBySlugPrefix(db, "seed-");
  if (REFRESH) await deleteBySlugPrefix(db, `${SEED_TAG}-`);

  const hostIds = await ensureHosts(db);
  if (!hostIds.length) {
    console.error("❌ No hosts");
    process.exit(1);
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  let ok = 0;
  let skipped = 0;

  for (let i = 0; i < listings.length; i++) {
    const item = listings[i];
    const hostId = hostIds[i % hostIds.length];
    const host = HOSTS[i % HOSTS.length];

    const { data: existing } = await db
      .from("listings")
      .select("id")
      .eq("slug", item.slug)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const row = {
      slug: item.slug,
      user_id: hostId,
      title: item.title,
      description: item.description,
      city: item.city,
      area: item.area,
      address: buildAddress(item),
      address_street: item.street,
      address_number: item.number,
      address_postal_code: item.postal,
      latitude: item.lat,
      longitude: item.lng,
      formatted_address: buildAddress(item),
      location_confirmed_by_owner: true,
      location_confirmed_at: new Date().toISOString(),
      rental_type: item.rentalType,
      supports_short_term: item.rentalType === "short_term",
      supports_monthly: true,
      price_type: item.rentalType === "short_term" ? "per_night" : "per_month",
      price_monthly: item.priceMonthly,
      price_per_night: item.pricePerNight,
      included_guests: item.rentalType === "short_term" ? Math.max(2, item.bedrooms + 1) : null,
      extra_guest_fee_per_night: item.rentalType === "short_term" ? 12 : null,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      sqm: item.sqm,
      max_guests: item.rentalType === "short_term" ? Math.max(2, item.bedrooms * 2) : null,
      min_months: item.rentalType === "monthly" ? 2 : 1,
      min_stay_label: item.rentalType === "short_term" ? "2 νύχτες" : "2 μήνες",
      furnished: true,
      utilities_included: item.rentalType === "short_term",
      property_type: item.propertyType,
      ama_number: item.amaNumber,
      legal_registry_type: item.withAma ? "ama" : "none",
      accepts_under_60_days: item.withAma,
      ama_declaration_accepted: item.withAma,
      owner_responsibility_accepted: true,
      platform_role_accepted: true,
      terms_privacy_accepted: true,
      contact_name: host.name,
      contact_phone: host.phone,
      contact_email: host.email,
      preferred_contact: "phone",
      allow_phone_contact: true,
      allow_whatsapp: true,
      allow_viber: i % 3 === 0,
      allow_message: true,
      availability_status: "available_now",
      status: "approved",
      approval_status: "approved",
      expires_at: expiresAt.toISOString(),
      advertiser_verification_status: "verified",
      property_verification_status: "verified",
      midora_verification_code: `GR-${String(i + 1).padStart(3, "0")}`,
    };

    const { data: inserted, error } = await insertListingRow(db, row, hostId);
    if (error || !inserted?.id) {
      console.error(`  ✗ ${item.slug}:`, error?.message);
      continue;
    }

    const photoCount = await mirrorPhotos(db, inserted.id, hostId, item.photoUrls);
    if (photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW) {
      console.warn(`  ⚠ ${item.title}: ${photoCount} φωτό`);
    }

    ok++;
    if (ok % 10 === 0 || ok === listings.length) {
      console.log(`  … ${ok}/${listings.length} (${item.city} — ${item.area})`);
    }
  }

  console.log(`\n✅ Εισήχθησαν ${ok} αγγελίες (${skipped} ήδη υπήρχαν)`);
  console.log("   Φωτογραφίες: Pexels → Supabase storage");
  console.log("   → http://localhost:3000/listings\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
