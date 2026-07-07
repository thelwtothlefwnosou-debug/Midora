import { PROPERTY_TYPES } from "@/lib/types";

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
