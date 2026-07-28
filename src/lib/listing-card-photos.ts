import { resolveListingImageUrl } from "@/lib/listing-media";

export type ListingCardPhotoInput = {
  url?: string | null;
  media_type?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

/** Max indicator dots on listing card carousels (still scrolls all photos). */
export const LISTING_CARD_CAROUSEL_MAX_DOTS = 5;

/**
 * Cover/primary first, then existing sort order.
 * Drops videos, empty URLs, and duplicate resolved URLs.
 * Pass `max: null` for no photo cap (card carousel scrolls all photos).
 */
export function collectListingCardPhotoUrls(
  images: ListingCardPhotoInput[] | null | undefined,
  options?: { max?: number | null }
): string[] {
  const max = options?.max === undefined ? 8 : options.max;
  const photos = [...(images ?? [])]
    .filter((img) => img.media_type !== "video")
    .sort((a, b) => {
      const aCover = a.is_cover ? 1 : 0;
      const bCover = b.is_cover ? 1 : 0;
      if (aCover !== bCover) return bCover - aCover;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const img of photos) {
    if (max != null && urls.length >= max) break;
    const resolved = resolveListingImageUrl(img.url);
    if (!resolved) continue;
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    urls.push(resolved);
  }

  return urls;
}

/** How many dots to render for a card carousel (capped). */
export function resolveCarouselDotCount(
  photoCount: number,
  maxDots = LISTING_CARD_CAROUSEL_MAX_DOTS
): number {
  if (photoCount <= 1) return 0;
  return Math.min(photoCount, maxDots);
}

/** Which of the (≤ maxDots) indicators is active for the current photo. */
export function resolveCarouselActiveDotIndex(
  photoIndex: number,
  photoCount: number,
  maxDots = LISTING_CARD_CAROUSEL_MAX_DOTS
): number {
  if (photoCount <= 1) return 0;
  const safePhoto = Math.min(Math.max(photoIndex, 0), photoCount - 1);
  if (photoCount <= maxDots) return safePhoto;
  return Math.min(
    maxDots - 1,
    Math.round((safePhoto / (photoCount - 1)) * (maxDots - 1))
  );
}

/** Wrap-around next/prev index for a carousel of `length` slides. */
export function stepCarouselIndex(
  current: number,
  length: number,
  delta: number
): number {
  if (length <= 0) return 0;
  const safe = ((current % length) + length) % length;
  return (((safe + delta) % length) + length) % length;
}

export const CAROUSEL_SWIPE_THRESHOLD_PX = 40;

/** Horizontal swipe → prev/next; vertical or tiny moves ignored. */
export function resolveCarouselSwipeDirection(
  deltaX: number,
  deltaY = 0,
  threshold = CAROUSEL_SWIPE_THRESHOLD_PX
): "prev" | "next" | null {
  if (Math.abs(deltaX) < threshold) return null;
  if (Math.abs(deltaY) > Math.abs(deltaX)) return null;
  return deltaX > 0 ? "prev" : "next";
}

/** Isolates carousel controls from parent Link navigation. */
export function isolateCarouselControlEvent(event: {
  preventDefault: () => void;
  stopPropagation: () => void;
}): void {
  event.preventDefault();
  event.stopPropagation();
}
