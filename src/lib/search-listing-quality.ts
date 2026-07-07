import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl, resolveListingImageUrl } from "@/lib/listing-media";
import {
  isPublicMvpListing,
  listingRentalType,
  listingSupportsMonthly,
  listingSupportsShortTerm,
} from "@/lib/rental-types";

const BAD_TEXT_PATTERNS = [
  /\.env/i,
  /cursor/i,
  /vscode/i,
  /screenshot/i,
  /supabase\s+key/i,
  /test\s*listing/i,
  /demo\s*listing/i,
  /lorem\s+ipsum/i,
  /pexels/i,
  /\bplaceholder\b/i,
];

/** Block obvious non-property covers — not whole CDNs like Unsplash. */
const BAD_COVER_URL_PATTERNS = [
  /avatar/i,
  /profile[-_]?photo/i,
  /profile[-_]?avatar/i,
  /\/profiles\//i,
  /selfie/i,
  /headshot/i,
  /\/people\//i,
  /\/person\//i,
  /\/pet/i,
  /\/pets/i,
  /dog[-_]?photo/i,
  /cat[-_]?photo/i,
  /screenshot/i,
  /placeholder\.(com|io)/i,
  /via\.placeholder/i,
  /pexels/i,
  /unsplash\.com\/photo-1560448204/i,
  /\.env/i,
  /whatsapp/i,
  /telegram/i,
];

function containsBadPattern(text: string): boolean {
  return BAD_TEXT_PATTERNS.some((re) => re.test(text));
}

function isBadCoverUrl(url: string): boolean {
  return BAD_COVER_URL_PATTERNS.some((re) => re.test(url));
}

function hasValidCoverPhoto(listing: ListingWithImages): boolean {
  const images = (listing.listing_images ?? []).filter((img) => img.media_type !== "video");
  if (images.length === 0) return false;

  const coverUrl = pickListingCoverPhotoUrl(listing);
  if (!coverUrl || isBadCoverUrl(coverUrl)) return false;

  return images.some((img) => {
    const resolved = resolveListingImageUrl(img.url);
    return Boolean(resolved && !isBadCoverUrl(resolved));
  });
}

function hasValidPriceForMode(listing: ListingWithImages): boolean {
  const rt = listingRentalType(listing);
  if (rt === "short_term" || listingSupportsShortTerm(listing)) {
    if ((listing.price_per_night ?? 0) > 0) return true;
  }
  if (listingSupportsMonthly(listing) && listing.price_monthly > 0) {
    return true;
  }
  return listing.price_monthly > 0;
}

function isPublishedListing(listing: ListingWithImages): boolean {
  if (listing.status !== "approved") return false;
  if (listing.is_hidden) return false;
  if (listing.expires_at && new Date(listing.expires_at) <= new Date()) return false;
  if (listing.approval_status === "rejected") return false;
  return true;
}

/**
 * Public search results quality gate — strict on bad covers/test data,
 * but lenient enough to show real inventory (unlike homepage hero).
 */
export function isSearchQualityListing(listing: ListingWithImages): boolean {
  if (!isPublicMvpListing(listing)) return false;
  if (!isPublishedListing(listing)) return false;

  const title = listing.title?.trim() ?? "";
  if (title.length < 3) return false;
  if (containsBadPattern(title)) return false;

  const city = listing.city?.trim() ?? "";
  if (!city) return false;

  if (!hasValidPriceForMode(listing)) return false;
  if (!hasValidCoverPhoto(listing)) return false;

  if (listing.bedrooms == null || listing.bedrooms < 0) return false;

  return true;
}
