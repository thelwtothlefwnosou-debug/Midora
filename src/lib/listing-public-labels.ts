import type { ListingPublicDetail } from "@/lib/types";
import { resolveListingBathrooms } from "@/lib/listing-filter-helpers";
import { countBedsFromSleeping } from "@/lib/listing-short-term-price";

/** next-intl translator for `Listing.labels` (or compatible). */
export type PublicLabelsT = {
  (key: string, values?: Record<string, string | number>): string;
};

/** next-intl translator for `PropertyTypes` (or compatible). */
export type PropertyTypesT = {
  (key: string): string;
};

export function formatPublicBedroomsLabel(
  bedrooms: number,
  t: PublicLabelsT
): string {
  if (bedrooms <= 0) return t("studio");
  return t("bedrooms", { count: bedrooms });
}

export function formatPublicBathroomsLabel(
  bathrooms: number,
  t: PublicLabelsT
): string {
  return t("bathrooms", { count: bathrooms });
}

export function formatPublicBedsLabel(count: number, t: PublicLabelsT): string {
  return t("beds", { count });
}

export function formatPublicGuestsLabel(
  count: number,
  t: PublicLabelsT
): string {
  return t("guestsMax", { count });
}

export function formatPublicGuestsSummaryLabel(
  count: number,
  t: PublicLabelsT
): string {
  return t("guestsSummary", { count });
}

export function formatPublicSqmLabel(sqm: number, t: PublicLabelsT): string {
  return t("sqm", { sqm });
}

export function formatPublicPropertyTypeLabel(
  propertyType: string | null | undefined,
  t: PublicLabelsT,
  tPropertyTypes: PropertyTypesT
): string {
  if (!propertyType) return t("propertyFallback");
  const known = [
    "apartment",
    "house",
    "studio",
    "room",
    "villa",
    "other",
  ] as const;
  if ((known as readonly string[]).includes(propertyType)) {
    return tPropertyTypes(propertyType);
  }
  return propertyType;
}

export function formatPublicPropertyArrangementLabel(
  propertyType: string | null | undefined,
  t: PublicLabelsT,
  tPropertyTypes: PropertyTypesT
): string {
  if (propertyType === "room") {
    return formatPublicPropertyTypeLabel(propertyType, t, tPropertyTypes);
  }
  if (propertyType === "apartment") {
    return t("arrangementApartment");
  }
  const base = formatPublicPropertyTypeLabel(propertyType, t, tPropertyTypes);
  return t("arrangementEntire", { type: base });
}

export function formatPublicLocationLabel(
  listing: Pick<
    ListingPublicDetail,
    "area" | "city" | "area_display_name" | "city_display_name"
  >,
  t: PublicLabelsT
): string {
  const area = listing.area_display_name ?? listing.area;
  const city = listing.city_display_name ?? listing.city;
  return t("locationGreece", { area, city });
}

export function buildPublicPropertySummaryLine(
  listing: ListingPublicDetail,
  t: PublicLabelsT,
  tPropertyTypes: PropertyTypesT
): string {
  return `${formatPublicPropertyArrangementLabel(listing.property_type, t, tPropertyTypes)} · ${formatPublicLocationLabel(listing, t)}`;
}

export function buildPublicListingMetadataLine(
  listing: ListingPublicDetail,
  t: PublicLabelsT
): string {
  const beds =
    listing.sleeping_arrangements.length > 0
      ? countBedsFromSleeping(listing.sleeping_arrangements)
      : listing.bedrooms;
  const baths = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const parts: string[] = [];

  if (listing.max_guests != null) {
    parts.push(formatPublicGuestsSummaryLabel(listing.max_guests, t));
  }
  parts.push(formatPublicBedroomsLabel(listing.bedrooms, t));
  if (beds > 0) parts.push(formatPublicBedsLabel(beds, t));
  parts.push(formatPublicBathroomsLabel(baths, t));

  return parts.join(" · ");
}
