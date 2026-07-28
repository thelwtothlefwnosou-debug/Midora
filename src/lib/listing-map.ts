/** Public map center: exact pin when owner confirmed, otherwise legacy approximate offset. */
export function getListingMapCenter(
  listingId: string,
  lat: number,
  lng: number,
  locationConfirmedByOwner?: boolean | null
): { lat: number; lng: number } {
  if (locationConfirmedByOwner) {
    return { lat, lng };
  }
  return approximateListingMapCenter(listingId, lat, lng);
}

/** Finite coordinates required for search list cards and map markers. */
export function listingHasSearchMapCoordinates(listing: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean {
  return (
    listing.latitude != null &&
    listing.longitude != null &&
    Number.isFinite(listing.latitude) &&
    Number.isFinite(listing.longitude)
  );
}

/** @deprecated Use getListingMapCenter with location_confirmed_by_owner */
export function approximateListingMapCenter(
  listingId: string,
  lat: number,
  lng: number
): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    hash = (hash * 31 + listingId.charCodeAt(i)) | 0;
  }
  const angle = ((hash % 360) * Math.PI) / 180;
  const dist = 0.0018 + (Math.abs(hash) % 80) / 80000;
  return {
    lat: lat + dist * Math.cos(angle),
    lng: lng + dist * Math.sin(angle) * 1.25,
  };
}

export function listingShowsExactPublicLocation(listing: {
  latitude?: number | null;
  longitude?: number | null;
  location_confirmed_by_owner?: boolean | null;
}): boolean {
  return (
    listing.location_confirmed_by_owner === true &&
    listing.latitude != null &&
    listing.longitude != null
  );
}
