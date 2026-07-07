/**
 * End-to-end photo persist test (Storage + DB + re-fetch).
 * Run: npm run test:listing-photo-persist
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  fetchListingMediaForUpload,
  insertListingImageAfterUpload,
} from "../src/lib/listing-image-db";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** 1x1 PNG */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function main() {
  console.log("\n🧪 Full listing photo upload test (Storage + DB + re-fetch)\n");

  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase env vars");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as any;

  const { data: listing } = await db
    .from("listings")
    .select("id, user_id")
    .eq("id", "7467ba23-147c-46af-8ce3-4d4f0156c575")
    .maybeSingle();

  const targetListing =
    listing ??
    (await db.from("listings").select("id, user_id").limit(1).maybeSingle()).data;

  if (!targetListing) {
    console.error("❌ No listing found");
    process.exit(1);
  }

  const listingId = targetListing.id as string;
  const ownerId = targetListing.user_id as string;
  console.log(`Listing: ${listingId}`);
  console.log(`Owner:   ${ownerId}`);

  // 1) Fetch existing (same as wizard pre-upload)
  const existing = await fetchListingMediaForUpload(db, listingId);
  if (existing.error) {
    console.error("❌ fetchListingMediaForUpload failed:", existing.error.message);
    process.exit(1);
  }
  console.log(`✅ Pre-upload fetch OK (${existing.data?.length ?? 0} existing rows)`);

  const sortOrder =
    (existing.data?.reduce((max, m) => Math.max(max, m.sort_order ?? 0), -1) ?? -1) + 1;

  // 2) Storage upload
  const fileId = randomUUID();
  const storagePath = `${ownerId}/${listingId}/${fileId}.png`;
  const { error: storageError } = await db.storage
    .from("listing-photos")
    .upload(storagePath, TINY_PNG, {
      contentType: "image/png",
      upsert: false,
    });

  if (storageError) {
    console.error("❌ Storage upload failed:", storageError.message);
    process.exit(1);
  }
  console.log("✅ Storage upload OK:", storagePath);

  const {
    data: { publicUrl },
  } = db.storage.from("listing-photos").getPublicUrl(storagePath);

  // 3) DB insert (same helper as wizard)
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
      is_cover: (existing.data?.length ?? 0) === 0,
      file_name: "test-screenshot.png",
      mime_type: "image/png",
      size_bytes: TINY_PNG.length,
    }
  );

  if (inserted.error || !inserted.data) {
    await db.storage.from("listing-photos").remove([storagePath]);
    console.error("❌ insertListingImageAfterUpload failed:", inserted.error?.message);
    process.exit(1);
  }
  console.log("✅ DB insert OK:", inserted.data.id);

  // 4) Re-fetch (simulates page refresh)
  const after = await fetchListingMediaForUpload(db, listingId);
  if (after.error) {
    console.error("❌ Post-upload fetch failed:", after.error.message);
    process.exit(1);
  }

  const found = after.data?.some((row) => row.id === inserted.data!.id);
  if (!found) {
    console.error("❌ Uploaded row not found after re-fetch");
    process.exit(1);
  }
  console.log("✅ Re-fetch after upload OK — photo persists");

  // 5) Cleanup
  await db.from("listing_images").delete().eq("id", inserted.data.id);
  await db.storage.from("listing-photos").remove([storagePath]);
  console.log("✅ Cleanup done\n");
  console.log("🎉 Full upload flow PASSED\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
