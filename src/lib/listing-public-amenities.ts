import {
  AMENITY_BY_KEY,
  isKnownAmenityKey,
  normalizeAmenityKey,
} from "@/lib/amenities-catalog";
import type { ListingAmenityRow, ListingHighlight, ListingWithImages } from "@/lib/types";

type ListingAmenitySource = Pick<
  ListingWithImages,
  "id" | "has_parking" | "has_elevator" | "has_balcony" | "pets_allowed" | "furnished" | "utilities_included"
>;

const LEGACY_BOOLEAN_KEYS: {
  when: (listing: ListingAmenitySource) => boolean;
  key: string;
}[] = [
  { when: (l) => Boolean(l.has_parking), key: "free_parking" },
  { when: (l) => Boolean(l.has_elevator), key: "elevator" },
  { when: (l) => Boolean(l.has_balcony), key: "balcony" },
  { when: (l) => Boolean(l.pets_allowed), key: "pets_allowed" },
  { when: (l) => Boolean(l.furnished), key: "furnished" },
  { when: (l) => Boolean(l.utilities_included), key: "bills_included" },
];

/** Merge DB amenity rows with legacy listing booleans (no description inference). */
export function resolvePublicAmenityKeys(
  listing: ListingAmenitySource,
  rows: ListingAmenityRow[] = []
): string[] {
  const keys = new Set<string>();

  for (const row of rows) {
    const normalized = normalizeAmenityKey(row.amenity_key);
    if (isKnownAmenityKey(normalized)) keys.add(normalized);
  }

  for (const legacy of LEGACY_BOOLEAN_KEYS) {
    if (legacy.when(listing) && isKnownAmenityKey(legacy.key)) {
      keys.add(legacy.key);
    }
  }

  return [...keys].sort((a, b) => {
    const orderA = AMENITY_BY_KEY[a]?.sortOrder ?? 9999;
    const orderB = AMENITY_BY_KEY[b]?.sortOrder ?? 9999;
    return orderA - orderB;
  });
}

export function resolvePublicAmenityRows(
  listing: ListingAmenitySource,
  rows: ListingAmenityRow[] = []
): ListingAmenityRow[] {
  const keys = resolvePublicAmenityKeys(listing, rows);
  return keys.map((amenity_key, sort_order) => ({
    id: rows.find((r) => normalizeAmenityKey(r.amenity_key) === amenity_key)?.id ?? `resolved-${amenity_key}`,
    listing_id: listing.id,
    amenity_key,
    sort_order,
  }));
}

export function listingHasAmenityKeys(
  listing: ListingAmenitySource,
  requiredKeys: string[],
  storedKeys: string[] = []
): boolean {
  if (!requiredKeys.length) return true;
  const resolved = new Set(resolvePublicAmenityKeys(listing, storedKeys.map((amenity_key, sort_order) => ({
    id: `idx-${amenity_key}`,
    listing_id: listing.id,
    amenity_key,
    sort_order,
  }))));
  return requiredKeys.every((key) => resolved.has(normalizeAmenityKey(key)));
}

type ListingHighlightSource = ListingAmenitySource &
  Pick<
    ListingWithImages,
    "nearby_metro" | "distance_beach" | "description"
  > & {
    highlights?: ListingHighlight[];
  };

export function resolvePublicHighlights(listing: ListingHighlightSource): ListingHighlight[] {
  if (listing.highlights?.length) return listing.highlights;

  const inferred: { label: string; icon_key: string }[] = [];

  if (listing.nearby_metro?.trim()) {
    inferred.push({
      label: `Κοντά σε μετρό · ${listing.nearby_metro.trim()}`,
      icon_key: "train",
    });
  }
  if (listing.has_parking) {
    inferred.push({ label: "Δωρεάν ιδιωτικό parking", icon_key: "car" });
  }
  if (listing.pets_allowed) {
    inferred.push({ label: "Επιτρέπονται κατοικίδια", icon_key: "paw" });
  }
  if (listing.furnished) {
    inferred.push({ label: "Επιπλωμένο και έτοιμο για κατοίκηση", icon_key: "users" });
  }
  if (listing.distance_beach?.trim()) {
    inferred.push({
      label: `Κοντά σε παραλία · ${listing.distance_beach.trim()}`,
      icon_key: "umbrella",
    });
  }

  return inferred.slice(0, 3).map((item, sort_order) => ({
    id: `inferred-${sort_order}`,
    listing_id: listing.id,
    label: item.label,
    icon_key: item.icon_key,
    sort_order,
  }));
}
