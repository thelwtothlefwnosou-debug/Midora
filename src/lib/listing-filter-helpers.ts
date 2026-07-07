export function estimateBathrooms(bedrooms: number): number {
  if (bedrooms <= 0) return 1;
  if (bedrooms <= 1) return 1;
  if (bedrooms <= 3) return 2;
  return Math.min(4, Math.ceil(bedrooms / 2));
}

export function resolveListingBathrooms(
  bathrooms: number | null | undefined,
  bedrooms: number
): number {
  if (bathrooms != null && Number.isFinite(bathrooms) && bathrooms >= 0) {
    return bathrooms;
  }
  return estimateBathrooms(bedrooms);
}

export function formatBedroomsLabel(bedrooms: number): string {
  if (bedrooms <= 0) return "Στούντιο";
  return `${bedrooms} υ/δ`;
}

export function formatBathroomsLabel(bathrooms: number): string {
  return `${bathrooms} μπ`;
}

export function formatFloorLabel(floor: number | null | undefined): string | null {
  if (floor == null || !Number.isFinite(floor)) return null;
  if (floor === 0) return "Ισόγειο";
  return `${floor}ος`;
}

export function propertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: "Διαμέρισμα",
    house: "Σπίτι",
    studio: "Στούντιο",
    room: "Δωμάτιο",
    villa: "Βίλα",
    other: "Άλλο",
  };
  return labels[type] ?? type;
}
