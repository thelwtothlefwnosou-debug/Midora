import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import {
  listingMatchesRentalTypeFilter,
  type MvpPublicRentalType,
} from "@/lib/rental-types";

/** Relaxed gate for carousel cards — stricter search quality blocks too much inventory. */
export function isNearbyListingCandidate(
  listing: ListingWithImages,
  rentalMode: MvpPublicRentalType
): boolean {
  if (listing.status !== "approved") return false;
  if (listing.is_hidden) return false;
  if (listing.expires_at && new Date(listing.expires_at) <= new Date()) return false;
  if (!listingMatchesRentalTypeFilter(listing, rentalMode)) return false;
  if (!pickListingCoverPhotoUrl(listing)) return false;
  if ((listing.title?.trim().length ?? 0) < 3) return false;
  if (!listing.city?.trim()) return false;
  if (rentalMode === "short_term" && (listing.price_per_night ?? 0) <= 0) return false;
  if (rentalMode === "monthly" && (listing.price_monthly ?? 0) <= 0) return false;
  return true;
}
