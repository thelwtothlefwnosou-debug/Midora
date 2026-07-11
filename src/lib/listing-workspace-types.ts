import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import type { RentalType } from "@/lib/rental-types";

export type ListingWorkspaceContext = {
  listing: ListingWithImages;
  effectiveStatus: ListingDisplayStatus;
  ownerStatusKey: OwnerListingStatusKey;
  ownerStatusLabel: string;
  rentalType: RentalType;
  photoCount: number;
};
