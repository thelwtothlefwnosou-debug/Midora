import { AMENITY_BY_KEY } from "@/lib/amenities-catalog";
import type { ListingAmenityRow, ListingHighlight, ListingWithImages } from "@/lib/types";

type ListingAmenitySource = Pick<
  ListingWithImages,
  "id" | "description" | "description_en" | "has_parking" | "has_elevator" | "has_balcony"
>;

type ListingHighlightSource = ListingAmenitySource &
  Pick<
    ListingWithImages,
    | "nearby_metro"
    | "pets_allowed"
    | "furnished"
    | "distance_beach"
  > & {
    highlights?: ListingHighlight[];
  };

const DESCRIPTION_AMENITY_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: /wifi|wi-fi|internet|οπτικών ινών|mbps/i, key: "wifi" },
  { pattern: /πλυντήριο/i, key: "washer" },
  { pattern: /κουζίνα/i, key: "kitchen" },
  { pattern: /κλιματισμ/i, key: "ac" },
  { pattern: /θέρμαν/i, key: "heating" },
  { pattern: /τηλεόραση|smart\s*tv|smarttv|hdtv/i, key: "tv" },
  { pattern: /χώρος εργασίας|workspace|γραφείο/i, key: "workspace" },
  { pattern: /μπαλκόνι|βεράντα|αίθριο|τεράτσα/i, key: "balcony" },
  { pattern: /parking|πάρκινγκ|στάθμευ/i, key: "free_parking" },
  { pattern: /ασανσέρ/i, key: "elevator" },
  { pattern: /πισίνα/i, key: "pool" },
  { pattern: /κήπος|αυλή/i, key: "garden" },
  { pattern: /self check-?in/i, key: "self_checkin" },
  { pattern: /θέα/i, key: "view" },
];

function isKnownAmenityKey(key: string): boolean {
  return Boolean(AMENITY_BY_KEY[key]);
}

/** Merge DB amenity rows with listing fields + description hints (legacy listings). */
export function resolvePublicAmenityKeys(
  listing: ListingAmenitySource,
  rows: ListingAmenityRow[] = []
): string[] {
  const keys = new Set<string>();

  for (const row of rows) {
    if (isKnownAmenityKey(row.amenity_key)) keys.add(row.amenity_key);
  }

  if (listing.has_parking) keys.add("free_parking");
  if (listing.has_elevator) keys.add("elevator");
  if (listing.has_balcony) keys.add("balcony");

  const text = `${listing.description ?? ""}\n${listing.description_en ?? ""}`;
  for (const { pattern, key } of DESCRIPTION_AMENITY_PATTERNS) {
    if (pattern.test(text) && isKnownAmenityKey(key)) keys.add(key);
  }

  return [...keys];
}

export function resolvePublicAmenityRows(
  listing: ListingAmenitySource,
  rows: ListingAmenityRow[] = []
): ListingAmenityRow[] {
  const keys = resolvePublicAmenityKeys(listing, rows);
  return keys.map((amenity_key, sort_order) => ({
    id: rows.find((r) => r.amenity_key === amenity_key)?.id ?? `resolved-${amenity_key}`,
    listing_id: listing.id,
    amenity_key,
    sort_order,
  }));
}

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
  if (/εργασία|workspace|remote|100mbps|mbps|internet/i.test(listing.description ?? "")) {
    inferred.push({ label: "Κατάλληλο για εργασία εξ αποστάσεως", icon_key: "laptop" });
  }

  return inferred.slice(0, 3).map((item, sort_order) => ({
    id: `inferred-${sort_order}`,
    listing_id: listing.id,
    label: item.label,
    icon_key: item.icon_key,
    sort_order,
  }));
}
