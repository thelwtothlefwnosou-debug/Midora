export type ListingDisplayStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export function getEffectiveListingStatus(listing: {
  status: string;
  expires_at: string | null;
}): ListingDisplayStatus {
  if (
    listing.status === "approved" &&
    listing.expires_at &&
    new Date(listing.expires_at) <= new Date()
  ) {
    return "expired";
  }
  return listing.status as ListingDisplayStatus;
}
