import { LISTING_PHOTOS_BUCKET } from "@/lib/listing-photo-upload";

/** Εξαγωγή storage path από public Supabase URL */
export function storagePathFromPublicUrl(url: string): string | null {
  for (const bucket of [LISTING_PHOTOS_BUCKET, "listing-images"]) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.slice(idx + marker.length));
    }
  }
  return null;
}

export function publicUrlForListingPhoto(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return storagePath;
  return `${base}/storage/v1/object/public/${LISTING_PHOTOS_BUCKET}/${storagePath.replace(/^\//, "")}`;
}
