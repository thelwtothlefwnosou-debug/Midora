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

/** Reject empty, data:, blob:, and obvious non-image / error payloads stored as URLs. */
export function isUsableListingImageUrl(url?: string | null): url is string {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  if (
    /validation_failed|unsupported provider|ow terminated|unexpectedly|"msg"\s*:/i.test(
      trimmed
    )
  ) {
    return false;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return Boolean(new URL(trimmed).hostname);
    } catch {
      return false;
    }
  }
  // Relative storage paths / object keys
  if (trimmed.includes("://")) return false;
  return trimmed.length > 2;
}

/** Resolve storage paths and relative URLs to absolute image URLs */
export function resolveListingImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !isUsableListingImageUrl(trimmed)) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const base = supabasePublicBase();
  if (!base) return null;

  if (trimmed.startsWith("/storage/")) return `${base}${trimmed}`;
  if (trimmed.startsWith("storage/v1/")) return `${base}/${trimmed}`;
  return `${base}/storage/v1/object/public/listing-photos/${trimmed.replace(/^\//, "")}`;
}

type CoverPhotoSource = {
  listing_images?: Array<{
    url: string;
    media_type?: string | null;
    is_cover?: boolean | null;
    sort_order?: number | null;
  }> | null;
};

/** Prefer lowest sort_order (owner’s first photo); is_cover is a sync’d flag, not a override. */
export function pickListingCoverPhotoUrl(
  listing: CoverPhotoSource | Pick<ListingWithImages, "listing_images">
): string | null {
  const photos = (listing.listing_images ?? []).filter(
    (img) => img.media_type !== "video"
  );
  if (photos.length === 0) return null;

  const sorted = [...photos].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const aCover = a.is_cover ? 1 : 0;
    const bCover = b.is_cover ? 1 : 0;
    return bCover - aCover;
  });

  for (const photo of sorted) {
    const resolved = resolveListingImageUrl(photo.url);
    if (resolved) return resolved;
  }
  return null;
}

export function getListingCoverImage(listing: ListingWithImages): string {
  return pickListingCoverPhotoUrl(listing) ?? FALLBACK_COVER;
}
