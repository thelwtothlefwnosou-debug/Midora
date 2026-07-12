import type { ListingWithImages } from "@/lib/types";
import { haversineMeters } from "@/lib/geo/polygon";
import { getSearchCatalogListings } from "@/lib/listings";
import {
  listingRentalType,
  type MvpPublicRentalType,
} from "@/lib/rental-types";
import { defaultPublicRentalMode } from "@/lib/listing-rental-modes";
import { isNearbyListingCandidate } from "@/lib/nearby-listing-candidates";

const DEFAULT_LIMIT = 12;
const MIN_NEARBY_RESULTS = 1;
const NEAR_RADIUS_M = 3_000;
const MID_RADIUS_M = 10_000;
const FAR_RADIUS_M = 25_000;

function hasCoordinates(
  listing: Pick<ListingWithImages, "latitude" | "longitude">
): listing is ListingWithImages & { latitude: number; longitude: number } {
  return (
    listing.latitude != null &&
    listing.longitude != null &&
    Number.isFinite(listing.latitude) &&
    Number.isFinite(listing.longitude)
  );
}

function distanceMeters(
  source: ListingWithImages,
  candidate: ListingWithImages
): number | null {
  if (!hasCoordinates(source) || !hasCoordinates(candidate)) return null;
  return haversineMeters(
    { lat: source.latitude, lng: source.longitude },
    { lat: candidate.latitude, lng: candidate.longitude }
  );
}

function rankNearby(
  source: ListingWithImages,
  candidates: ListingWithImages[],
  rentalMode: MvpPublicRentalType,
  limit: number
): ListingWithImages[] {
  const srcGuests = source.max_guests ?? 2;
  const srcPrice =
    rentalMode === "short_term"
      ? source.price_per_night ?? source.price_monthly
      : source.price_monthly;

  const scored = candidates
    .filter((c) => c.id !== source.id)
    .filter((c) => isNearbyListingCandidate(c, rentalMode))
    .map((c) => {
      let score = 0;
      const dist = distanceMeters(source, c);

      if (dist != null) {
        if (dist <= NEAR_RADIUS_M) score += 12;
        else if (dist <= MID_RADIUS_M) score += 8;
        else if (dist <= FAR_RADIUS_M) score += 4;
        else score -= 1;
        score += Math.max(0, 6 - dist / NEAR_RADIUS_M);
      }

      if (c.area === source.area) score += 5;
      if (c.city === source.city) score += 3;
      if (c.property_type === source.property_type) score += 2;

      if (rentalMode === "short_term") {
        const guestDiff = Math.abs((c.max_guests ?? 2) - srcGuests);
        score += Math.max(0, 3 - guestDiff);
        const price = c.price_per_night ?? c.price_monthly;
        const priceDiff = Math.abs(price - srcPrice) / Math.max(srcPrice, 1);
        score += Math.max(0, 3 - priceDiff * 4);
      } else {
        const priceDiff =
          Math.abs(c.price_monthly - srcPrice) / Math.max(srcPrice, 1);
        score += Math.max(0, 3 - priceDiff * 3);
      }

      return { c, score, dist };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.dist != null && b.dist != null) return a.dist - b.dist;
      return 0;
    });

  return scored.slice(0, limit).map((s) => s.c);
}

export async function getNearbyListings(
  listing: ListingWithImages,
  options?: {
    rentalMode?: MvpPublicRentalType;
    limit?: number;
  }
): Promise<ListingWithImages[]> {
  const rentalMode = options?.rentalMode ?? defaultPublicRentalMode(listing);
  const limit = options?.limit ?? DEFAULT_LIMIT;

  if (listingRentalType(listing) === "long_term") return [];

  const catalog = await getSearchCatalogListings({}, 500);
  const candidates = catalog.filter((item) => isNearbyListingCandidate(item, rentalMode));

  if (candidates.length === 0) return [];

  const sameCity = candidates.filter((c) => c.city === listing.city);
  let results = rankNearby(
    listing,
    sameCity.length >= MIN_NEARBY_RESULTS ? sameCity : candidates,
    rentalMode,
    limit
  );

  if (results.length < MIN_NEARBY_RESULTS && sameCity.length > 0) {
    results = rankNearby(listing, candidates, rentalMode, limit);
  }

  return results.length >= MIN_NEARBY_RESULTS ? results : [];
}

/** @deprecated Use getNearbyListings */
export async function getSimilarListings(
  listing: ListingWithImages,
  limit = DEFAULT_LIMIT
): Promise<ListingWithImages[]> {
  return getNearbyListings(listing, { limit });
}
