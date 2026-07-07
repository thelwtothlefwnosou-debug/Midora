import type { ListingWithImages } from "@/lib/types";

export const LISTING_PLACEHOLDER_LABEL = "Η φωτογραφία δεν είναι διαθέσιμη";

/** Neutral fallback when no listing photo is available */
export const LISTING_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&sat=-100&brightness=1.05";

const FALLBACK_COVER = LISTING_PLACEHOLDER_IMAGE;

function supabasePublicBase(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${url}.supabase.co`;
}

/** Resolve storage paths and relative URLs to absolute image URLs */
export function resolveListingImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const base = supabasePublicBase();
  if (!base) return null;

  if (trimmed.startsWith("/storage/")) return `${base}${trimmed}`;
  if (trimmed.startsWith("storage/v1/")) return `${base}/${trimmed}`;
  return `${base}/storage/v1/object/public/listing-photos/${trimmed.replace(/^\//, "")}`;
}

/** Prefer cover photo; returns null when no valid listing photo exists. */
export function pickListingCoverPhotoUrl(
  listing: Pick<ListingWithImages, "listing_images">
): string | null {
  const images = listing.listing_images ?? [];
  const candidate =
    images.find((img) => img.is_cover && img.media_type !== "video") ??
    images.find((img) => img.media_type !== "video");
  return resolveListingImageUrl(candidate?.url);
}

export function getListingCoverImage(listing: ListingWithImages): string {
  return pickListingCoverPhotoUrl(listing) ?? FALLBACK_COVER;
}
