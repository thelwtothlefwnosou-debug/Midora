import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl, resolveListingImageUrl } from "@/lib/listing-media";
import {
  isPublicMvpListing,
  listingMatchesRentalTypeFilter,
  listingRentalType,
  listingSupportsMonthly,
  listingSupportsShortTerm,
} from "@/lib/rental-types";

const GREEK_CHARS = /[\u0370-\u03FF\u1F00-\u1FFF]/;

const BAD_TEXT_PATTERNS = [
  /villa\s+in/i,
  /apartment\s+in/i,
  /studio\s+in/i,
  /room\s+in/i,
  /\.env/i,
  /cursor/i,
  /vscode/i,
  /vs\s*code/i,
  /screenshot/i,
  /terminal/i,
  /supabase\s+key/i,
  /api[_\s]?key/i,
  /test\s*listing/i,
  /demo\s*listing/i,
  /lorem\s+ipsum/i,
];

const BAD_IMAGE_URL_PATTERNS = [
  /cursor/i,
  /vscode/i,
  /\.env/i,
  /screenshot/i,
  /placeholder\.(com|io)/i,
  /via\.placeholder/i,
  /avatar/i,
  /profile[-_]?photo/i,
  /profile[-_]?avatar/i,
  /\/profiles\//i,
  /selfie/i,
  /headshot/i,
  /portrait/i,
  /\/pet/i,
  /\/pets/i,
  /dog[-_]?photo/i,
  /cat[-_]?photo/i,
  /whatsapp/i,
  /telegram/i,
];

function containsBadPattern(text: string): boolean {
  return BAD_TEXT_PATTERNS.some((re) => re.test(text));
}

function isBadImageUrl(url: string): boolean {
  return BAD_IMAGE_URL_PATTERNS.some((re) => re.test(url));
}

function hasValidCoverPhoto(listing: ListingWithImages): boolean {
  const url = pickListingCoverPhotoUrl(listing);
  if (!url) return false;
  if (isBadImageUrl(url)) return false;

  const images = listing.listing_images ?? [];
  return images.some((img) => {
    if (img.media_type === "video") return false;
    const resolved = resolveListingImageUrl(img.url);
    if (!resolved || isBadImageUrl(resolved)) return false;
    return true;
  });
}

function hasValidLocation(listing: ListingWithImages): boolean {
  const city = listing.city?.trim() ?? "";
  if (!city) return false;
  if (!GREEK_CHARS.test(city)) return false;
  if (containsBadPattern(city)) return false;
  const area = listing.area?.trim() ?? "";
  if (area && containsBadPattern(area)) return false;
  return true;
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

function hasDisplayableTitle(title: string): boolean {
  const trimmed = title.trim();
  if (trimmed.length < 4) return false;
  if (containsBadPattern(trimmed)) return false;
  // Prefer Greek titles; still allow bilingual titles with enough Greek.
  if (GREEK_CHARS.test(trimmed)) return true;
  // Fallback: readable Latin title without spam patterns (real published inventory).
  return /[a-zA-Z]{4,}/.test(trimmed) && !isMostlySpamLatin(trimmed);
}

function isMostlySpamLatin(title: string): boolean {
  return /lorem|test listing|demo listing|asdf|qwerty/i.test(title);
}

/** Strict quality gate for homepage inventory cards. */
export function isHomepageQualityListing(listing: ListingWithImages): boolean {
  if (!isPublicMvpListing(listing)) return false;
  if (!isPublishedListing(listing)) return false;
  if (!hasValidCoverPhoto(listing)) return false;
  if (!hasDisplayableTitle(listing.title)) return false;
  if (!hasValidLocation(listing)) return false;
  if (!hasValidPriceForMode(listing)) return false;
  if (listing.bedrooms != null && listing.bedrooms < 0) return false;
  return true;
}

/** @deprecated Use isHomepageQualityListing */
export function listingHasDisplayPhoto(listing: ListingWithImages): boolean {
  return hasValidCoverPhoto(listing);
}

export function pickHomepageListings(
  listings: ListingWithImages[],
  max = 6
): ListingWithImages[] {
  return shuffleListings(listings.filter(isHomepageQualityListing)).slice(0, max);
}

/** Fisher–Yates shuffle — in-memory only (no SQL RANDOM). */
export function shuffleListings<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

/**
 * Random homepage cards for one rental mode.
 * Pool is fetched/cached separately; shuffle runs per request so cards rotate.
 */
export function pickHomepageListingsByMode(
  listings: ListingWithImages[],
  mode: "short_term" | "monthly",
  max = 6
): ListingWithImages[] {
  const pool = listings
    .filter(isHomepageQualityListing)
    .filter((listing) => listingMatchesRentalTypeFilter(listing, mode))
    .filter((listing) => {
      if (mode === "short_term") return (listing.price_per_night ?? 0) > 0;
      return listing.price_monthly > 0;
    });

  return shuffleListings(pool).slice(0, max);
}
