import type { MapBounds } from "@/lib/geo/polygon";
import type { ListingWithImages } from "@/lib/types";

export function listingInMapBounds(
  listing: Pick<ListingWithImages, "latitude" | "longitude">,
  bounds: MapBounds
): boolean {
  if (listing.latitude == null || listing.longitude == null) return false;
  return (
    listing.latitude <= bounds.north &&
    listing.latitude >= bounds.south &&
    listing.longitude <= bounds.east &&
    listing.longitude >= bounds.west
  );
}

export function filterListingsByMapBounds(
  listings: ListingWithImages[],
  bounds: MapBounds
): ListingWithImages[] {
  return listings.filter((l) => listingInMapBounds(l, bounds));
}
