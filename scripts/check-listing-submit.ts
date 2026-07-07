/**
 * Diagnose listing submit readiness (photos + required fields).
 * Run: npx tsx scripts/check-listing-submit.ts [listingId]
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  countSavedListingPhotos,
  isListingPhotoRow,
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

const DEFAULT_LISTING_ID = "7467ba23-147c-46af-8ce3-4d4f0156c575";

async function main() {
  const listingId = process.argv[2]?.trim() || DEFAULT_LISTING_ID;
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
    .select("id, user_id, title, city, area, status, sqm, bedrooms, description")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    console.error("Listing not found:", listingError?.message ?? listingId);
    process.exit(1);
  }

  const { data: images } = await db
    .from("listing_images")
    .select("id, media_type, url, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  const savedCount = await countSavedListingPhotos(db, listingId);

  const legacyNeq = await db
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .neq("media_type", "video");

  const nullMediaType =
    images?.filter((row) => row.media_type == null).length ?? 0;
  const clientCount = images?.filter(isListingPhotoRow).length ?? 0;

  console.log("\nListing submit diagnostic\n");
  console.log(JSON.stringify({ listing }, null, 2));
  console.log("\nPhoto counts:");
  console.log(
    JSON.stringify(
      {
        listingId,
        totalRows: images?.length ?? 0,
        savedCountNewLogic: savedCount,
        legacyNeqCount: legacyNeq.count ?? 0,
        nullMediaTypeRows: nullMediaType,
        clientFilterCount: clientCount,
        minRequired: MIN_LISTING_PHOTOS_FOR_REVIEW,
        photosReady: savedCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
      },
      null,
      2
    )
  );

  if (images?.length) {
    console.log("\nSample media_type values:");
    console.log(
      images.slice(0, 8).map((row) => ({
        id: row.id.slice(0, 8),
        media_type: row.media_type,
      }))
    );
  }

  const blockers: string[] = [];
  if (savedCount < MIN_LISTING_PHOTOS_FOR_REVIEW) {
    blockers.push(
      `Need ${MIN_LISTING_PHOTOS_FOR_REVIEW - savedCount} more saved photos`
    );
  }
  if (!listing.title?.trim()) blockers.push("Missing title");
  if (!listing.city?.trim()) blockers.push("Missing city");
  if (!listing.sqm) blockers.push("Missing sqm");

  console.log("\nPotential blockers:");
  console.log(blockers.length ? blockers : ["None detected from DB snapshot"]);
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
