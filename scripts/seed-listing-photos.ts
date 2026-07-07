/**
 * Upload N photos to a listing (keeps them — no cleanup).
 * Run: npx tsx scripts/seed-listing-photos.ts [listingId] [count]
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  countSavedListingPhotos,
  fetchListingMediaForUpload,
  insertListingImageAfterUpload,
} from "../src/lib/listing-image-db";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "../src/lib/constants";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnv();

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function main() {
  const listingId = process.argv[2]?.trim() || "415ccd99-9f2b-487e-b970-0382a2ed5e1d";
  const targetCount = Math.max(
    MIN_LISTING_PHOTOS_FOR_REVIEW,
    parseInt(process.argv[3] ?? String(MIN_LISTING_PHOTOS_FOR_REVIEW), 10)
  );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listing, error: listingError } = await db
    .from("listings")
    .select("id, user_id, title, sqm")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    console.error("Listing not found:", listingError?.message ?? listingId);
    process.exit(1);
  }

  const ownerId = listing.user_id as string;
  let existingCount = await countSavedListingPhotos(db, listingId);
  console.log(`Listing: ${listingId} (${listing.title})`);
  console.log(`Existing saved photos: ${existingCount}`);

  if (listing.sqm == null) {
    await db.from("listings").update({ sqm: 50 }).eq("id", listingId);
    console.log("Updated missing sqm -> 50");
  }

  const toUpload = Math.max(0, targetCount - existingCount);
  if (toUpload === 0) {
    console.log(`Already has ${existingCount} photos (>= ${targetCount}). Nothing to upload.`);
    console.log(`Open: /dashboard/listings/new?draft=${listingId}`);
    return;
  }

  console.log(`Uploading ${toUpload} photos...`);

  for (let i = 0; i < toUpload; i++) {
    const existing = await fetchListingMediaForUpload(db, listingId);
    const sortOrder =
      (existing.data?.reduce((max, m) => Math.max(max, m.sort_order ?? 0), -1) ?? -1) + 1;
    const fileId = randomUUID();
    const storagePath = `${ownerId}/${listingId}/${fileId}.png`;

    const { error: storageError } = await db.storage
      .from("listing-photos")
      .upload(storagePath, TINY_PNG, { contentType: "image/png", upsert: false });

    if (storageError) {
      console.error("Storage upload failed:", storageError.message);
      process.exit(1);
    }

    const {
      data: { publicUrl },
    } = db.storage.from("listing-photos").getPublicUrl(storagePath);

    const inserted = await insertListingImageAfterUpload(
      db,
      {
        listing_id: listingId,
        url: publicUrl,
        sort_order: sortOrder,
        media_type: "image",
      },
      {
        owner_id: ownerId,
        storage_path: storagePath,
        is_cover: existingCount + i === 0,
        file_name: `seed-photo-${i + 1}.png`,
        mime_type: "image/png",
        size_bytes: TINY_PNG.length,
      }
    );

    if (inserted.error || !inserted.data) {
      console.error("DB insert failed:", inserted.error?.message);
      process.exit(1);
    }

    console.log(`  + photo ${i + 1}/${toUpload}: ${inserted.data.id}`);
  }

  existingCount = await countSavedListingPhotos(db, listingId);
  console.log(`Done. Saved photo count: ${existingCount}`);
  console.log(`Resume wizard: /dashboard/listings/new?draft=${listingId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
