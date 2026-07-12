import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import type { RentalType } from "@/lib/rental-types";
import type { ListingAccessContext } from "@/lib/listing-access";
import type { CohostPermissionFlags } from "@/lib/listing-cohost-permissions";

export type ListingSwitcherItem = {
  id: string;
  title: string;
  location: string;
  coverUrl: string | null;
  statusKey: OwnerListingStatusKey;
  statusLabel: string;
  rentalType: RentalType;
  isCohost?: boolean;
};

export type ListingWorkspaceContext = {
  listing: ListingWithImages;
  effectiveStatus: ListingDisplayStatus;
  ownerStatusKey: OwnerListingStatusKey;
  ownerStatusLabel: string;
  rentalType: RentalType;
  photoCount: number;
  access: ListingAccessContext;
  permissions: CohostPermissionFlags;
};
