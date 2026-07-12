import type { ListingPublicDetail } from "@/lib/types";
import { PROPERTY_TYPES } from "@/lib/types";
import { resolveListingBathrooms } from "@/lib/listing-filter-helpers";
import { countBedsFromSleeping } from "@/lib/listing-short-term-price";

export function formatPublicBedroomsLabel(bedrooms: number): string {
  if (bedrooms <= 0) return "Στούντιο";
  return bedrooms === 1 ? "1 υπνοδωμάτιο" : `${bedrooms} υπνοδωμάτια`;
}

export function formatPublicBathroomsLabel(bathrooms: number): string {
  return bathrooms === 1 ? "1 μπάνιο" : `${bathrooms} μπάνια`;
}

export function formatPublicBedsLabel(count: number): string {
  return count === 1 ? "1 κρεβάτι" : `${count} κρεβάτια`;
}

export function formatPublicGuestsLabel(count: number): string {
  return `Μέχρι ${count} ${count === 1 ? "άτομο" : "άτομα"}`;
}

export function formatPublicGuestsSummaryLabel(count: number): string {
  return `${count} ${count === 1 ? "επισκέπτης" : "επισκέπτες"}`;
}

export function formatPublicSqmLabel(sqm: number): string {
  return `${sqm} τ.μ.`;
}

export function formatPublicPropertyTypeLabel(
  propertyType: string | null | undefined
): string {
  if (!propertyType) return "Ακίνητο";
  return (
    PROPERTY_TYPES.find((p) => p.value === propertyType)?.label ?? propertyType
  );
}

export function formatPublicPropertyArrangementLabel(
  propertyType: string | null | undefined
): string {
  if (propertyType === "room") {
    return formatPublicPropertyTypeLabel(propertyType);
  }
  if (propertyType === "apartment") {
    return "Διαμέρισμα σε πολυκατοικία ως ολόκληρος χώρος";
  }
  const base = formatPublicPropertyTypeLabel(propertyType);
  return `${base} ως ολόκληρος χώρος`;
}

export function formatPublicLocationLabel(
  listing: Pick<
    ListingPublicDetail,
    "area" | "city" | "area_display_name" | "city_display_name"
  >
): string {
  const area = listing.area_display_name ?? listing.area;
  const city = listing.city_display_name ?? listing.city;
  return `${area}, ${city}, Ελλάδα`;
}

export function buildPublicPropertySummaryLine(
  listing: ListingPublicDetail
): string {
  return `${formatPublicPropertyArrangementLabel(listing.property_type)} · ${formatPublicLocationLabel(listing)}`;
}

export function buildPublicListingMetadataLine(
  listing: ListingPublicDetail
): string {
  const beds =
    listing.sleeping_arrangements.length > 0
      ? countBedsFromSleeping(listing.sleeping_arrangements)
      : listing.bedrooms;
  const baths = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const parts: string[] = [];

  if (listing.max_guests != null) {
    parts.push(formatPublicGuestsSummaryLabel(listing.max_guests));
  }
  parts.push(formatPublicBedroomsLabel(listing.bedrooms));
  if (beds > 0) parts.push(formatPublicBedsLabel(beds));
  parts.push(formatPublicBathroomsLabel(baths));

  return parts.join(" · ");
}
