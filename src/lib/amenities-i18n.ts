import {
  amenityLabel,
  AMENITY_CATEGORY_LABELS,
  normalizeAmenityKey,
} from "@/lib/amenities-catalog";
import type { AmenityCategory } from "@/lib/amenities-catalog-types";

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

/**
 * Resolve a catalog amenity key to a localized label via next-intl `Amenities` messages.
 * Falls back to the catalog Greek label (or raw key) if the message is missing.
 */
export function getAmenityLabel(key: string, t: TranslateFn): string {
  const normalized = normalizeAmenityKey(key);
  const messageKey = `items.${normalized}`;
  try {
    const label = t(messageKey);
    if (!label || label === messageKey || label.endsWith(`.${normalized}`)) {
      return amenityLabel(normalized);
    }
    return label;
  } catch {
    return amenityLabel(normalized);
  }
}

export function getAmenityCategoryLabel(
  category: AmenityCategory,
  t: TranslateFn
): string {
  const messageKey = `categories.${category}`;
  try {
    const label = t(messageKey);
    if (!label || label === messageKey || label.endsWith(`.${category}`)) {
      return AMENITY_CATEGORY_LABELS[category] ?? category;
    }
    return label;
  } catch {
    return AMENITY_CATEGORY_LABELS[category] ?? category;
  }
}
