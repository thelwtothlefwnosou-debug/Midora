import { pickLocale } from "@/lib/locale-fallbacks";

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

export function formatBedroomsLabel(bedrooms: number, locale?: string): string {
  return getFormatBedroomsLabel(bedrooms, undefined, locale);
}

export function formatBathroomsLabel(bathrooms: number, locale?: string): string {
  return getFormatBathroomsLabel(bathrooms, undefined, locale);
}

export function getFormatBedroomsLabel(
  bedrooms: number,
  t?: (key: "studio" | "bedrooms", values?: { count: number }) => string,
  locale?: string
): string {
  if (bedrooms <= 0) {
    return t ? t("studio") : pickLocale(locale, "Στούντιο", "Studio");
  }
  return t
    ? t("bedrooms", { count: bedrooms })
    : pickLocale(locale, `${bedrooms} υ/δ`, `${bedrooms} bd`);
}

export function getFormatBathroomsLabel(
  bathrooms: number,
  t?: (key: "bathrooms", values: { count: number }) => string,
  locale?: string
): string {
  return t
    ? t("bathrooms", { count: bathrooms })
    : pickLocale(locale, `${bathrooms} μπ`, `${bathrooms} bath`);
}

export function formatFloorLabel(
  floor: number | null | undefined,
  locale?: string
): string | null {
  return getFormatFloorLabel(floor, undefined, locale);
}

export function getFormatFloorLabel(
  floor: number | null | undefined,
  t?: (key: "groundFloor" | "floorN", values?: { floor: number }) => string,
  locale?: string
): string | null {
  if (floor == null || !Number.isFinite(floor)) return null;
  if (floor === 0) return t ? t("groundFloor") : pickLocale(locale, "Ισόγειο", "Ground floor");
  return t ? t("floorN", { floor }) : pickLocale(locale, `${floor}ος`, `Floor ${floor}`);
}

const PROPERTY_TYPE_LABELS_EL: Record<string, string> = {
  apartment: "Διαμέρισμα",
  house: "Σπίτι",
  studio: "Στούντιο",
  room: "Δωμάτιο",
  villa: "Βίλα",
  other: "Άλλο",
};

const PROPERTY_TYPE_LABELS_EN: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  studio: "Studio",
  room: "Room",
  villa: "Villa",
  other: "Other",
};

export function propertyTypeLabel(type: string, locale?: string): string {
  const labels = pickLocale(locale, PROPERTY_TYPE_LABELS_EL, PROPERTY_TYPE_LABELS_EN);
  return labels[type] ?? type;
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

const KNOWN_PROPERTY_TYPES = ["apartment", "house", "studio", "room", "villa", "other"] as const;

/**
 * i18n-aware property type label via next-intl `PropertyTypes` messages.
 * Falls back to the catalog Greek label if the message is missing.
 */
export function getPropertyTypeLabel(
  type: string,
  t: TranslateFn,
  locale?: string
): string {
  if (!(KNOWN_PROPERTY_TYPES as readonly string[]).includes(type)) {
    return propertyTypeLabel(type, locale);
  }
  try {
    const label = t(type);
    if (!label || label.endsWith(`.${type}`)) return propertyTypeLabel(type, locale);
    return label;
  } catch {
    return propertyTypeLabel(type, locale);
  }
}
