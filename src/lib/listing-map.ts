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

/**
 * Server-side public pin for search/map. Confirmed listings keep exact coords;
 * otherwise only the deterministic approximate center is returned.
 */
export function resolvePublicSearchMapCenter(listing: {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  location_confirmed_by_owner?: boolean | null;
}): { lat: number; lng: number } | null {
  if (!listingHasSearchMapCoordinates(listing)) return null;
  return getListingMapCenter(
    listing.id,
    listing.latitude!,
    listing.longitude!,
    listing.location_confirmed_by_owner === true
  );
}

type PublicSearchLocationFields = {
  latitude: number | null;
  longitude: number | null;
  public_map_coordinates: true;
  address: null;
  address_street: null;
  address_number: null;
  address_postal_code: null;
  address_floor: null;
  address_unit: null;
  formatted_address: null;
  provider_place_id: null;
  private_street: null;
  private_street_number: null;
  private_postal_code: null;
  floor: null;
};

/** Replace exact coords with public-safe center and strip private location fields. */
export function applyPublicSearchLocationPrivacy<
  T extends {
    id: string;
    latitude?: number | null;
    longitude?: number | null;
    location_confirmed_by_owner?: boolean | null;
  },
>(listing: T): T & PublicSearchLocationFields {
  const center = resolvePublicSearchMapCenter(listing);
  return {
    ...listing,
    latitude: center?.lat ?? null,
    longitude: center?.lng ?? null,
    public_map_coordinates: true,
    address: null,
    address_street: null,
    address_number: null,
    address_postal_code: null,
    address_floor: null,
    address_unit: null,
    formatted_address: null,
    provider_place_id: null,
    private_street: null,
    private_street_number: null,
    private_postal_code: null,
    floor: null,
  };
}
