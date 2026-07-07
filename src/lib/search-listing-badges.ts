import type { ListingWithImages } from "@/lib/types";
import { listingRentalBadgeLabels } from "@/lib/rental-types";

export type SearchListingBadge = {
  label: string;
  variant: "primary" | "secondary";
};

/** Max 2 badges on search cards — rental type label. */
export function getSearchListingBadges(listing: ListingWithImages): SearchListingBadge[] {
  const rentalBadges = listingRentalBadgeLabels(listing);
  return [{ label: rentalBadges.primary, variant: "primary" }];
}
