import {
  buildAmenitiesCatalog,
  LEGACY_AMENITY_KEY_ALIASES,
  MONTHLY_RECOMMENDED_KEYS,
  SHORT_TERM_RECOMMENDED_KEYS,
} from "@/lib/amenities-catalog-data";
import type {
  AmenityCategory,
  AmenityDef,
  AmenityDisplayGroup,
  RentalModeScope,
} from "@/lib/amenities-catalog-types";

export type { AmenityCategory, AmenityDef, AmenityDisplayGroup, RentalModeScope };

export const AMENITIES_CATALOG: AmenityDef[] = buildAmenitiesCatalog();

export const AMENITY_BY_KEY = Object.fromEntries(
  AMENITIES_CATALOG.map((a) => [a.key, a])
) as Record<string, AmenityDef>;

export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  basic: "Βασικά",
  bathroom: "Μπάνιο",
  bedroom_laundry: "Υπνοδωμάτιο και πλυντήριο",
  entertainment: "Ψυχαγωγία",
  family: "Οικογένεια",
  climate: "Θέρμανση και ψύξη",
  safety: "Ασφάλεια σπιτιού",
  internet_work: "Internet και χώρος εργασίας",
  kitchen_dining: "Κουζίνα και τραπεζαρία",
  location_features: "Χαρακτηριστικά τοποθεσίας",
  outdoor: "Εξωτερικοί χώροι",
  parking_facilities: "Parking και εγκαταστάσεις",
  accessibility: "Πρόσβαση / προσβασιμότητα",
  services: "Υπηρεσίες και ευκολίες",
  monthly_terms: "Μηνιαία / μεσοπρόθεσμη διαμονή",
};

export const AMENITY_CATEGORY_ORDER: AmenityCategory[] = [
  "basic",
  "bathroom",
  "bedroom_laundry",
  "entertainment",
  "family",
  "climate",
  "safety",
  "internet_work",
  "kitchen_dining",
  "location_features",
  "outdoor",
  "parking_facilities",
  "accessibility",
  "services",
  "monthly_terms",
];

export function normalizeAmenityKey(key: string): string {
  return LEGACY_AMENITY_KEY_ALIASES[key] ?? key;
}

export function isKnownAmenityKey(key: string): boolean {
  const normalized = normalizeAmenityKey(key);
  return Boolean(AMENITY_BY_KEY[normalized]);
}

export function amenityForMode(def: AmenityDef, mode: RentalModeScope): boolean {
  return def.modes === "both" || def.modes === mode;
}

export function catalogForRentalMode(mode: "short_term" | "monthly"): AmenityDef[] {
  return AMENITIES_CATALOG.filter((def) => amenityForMode(def, mode));
}

export function popularFilterAmenities(mode: "short_term" | "monthly"): AmenityDef[] {
  return catalogForRentalMode(mode).filter((def) =>
    mode === "monthly" ? def.isPopularFilterMonthly : def.isPopularFilterShort
  );
}

const SHORT_TERM_PRIORITY = [
  "wifi",
  "ac",
  "heating",
  "kitchen",
  "washer",
  "free_parking",
  "balcony",
  "terrace",
  "workspace",
  "tv",
  "elevator",
  "self_checkin",
  "private_pool",
  "hot_tub",
  "pets_allowed",
  "kid_friendly",
  "furnished",
  "bills_included",
] as const;

const MONTHLY_PRIORITY = [
  "furnished",
  "bills_included",
  "kitchen",
  "washer",
  "workspace",
  "wifi",
  "ac",
  "heating",
  "free_parking",
  "street_parking",
  "elevator",
  "tv",
  "balcony",
  "terrace",
  "students_suitable",
  "professionals_suitable",
  "pets_allowed",
] as const;

export function prioritizeAmenityKeys(
  keys: string[],
  mode: "short_term" | "monthly" = "short_term"
): string[] {
  const priority = mode === "monthly" ? MONTHLY_PRIORITY : SHORT_TERM_PRIORITY;
  const rank = new Map(priority.map((key, index) => [key, index]));
  const normalized = [...new Set(keys.map(normalizeAmenityKey).filter(isKnownAmenityKey))];
  return normalized.sort((a, b) => {
    const ra = rank.get(a as (typeof priority)[number]) ?? 999;
    const rb = rank.get(b as (typeof priority)[number]) ?? 999;
    if (ra !== rb) return ra - rb;
    const orderA = AMENITY_BY_KEY[a]?.sortOrder ?? 9999;
    const orderB = AMENITY_BY_KEY[b]?.sortOrder ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    return amenityLabel(a).localeCompare(amenityLabel(b), "el");
  });
}

export function amenitiesByCategoryGroups(keys: string[]): AmenityDisplayGroup[] {
  const normalized = [...new Set(keys.map(normalizeAmenityKey).filter(isKnownAmenityKey))];
  const grouped = new Map<AmenityCategory, string[]>();

  for (const key of normalized) {
    const def = AMENITY_BY_KEY[key];
    if (!def) continue;
    const list = grouped.get(def.category) ?? [];
    list.push(key);
    grouped.set(def.category, list);
  }

  return AMENITY_CATEGORY_ORDER.flatMap((category) => {
    const catKeys = grouped.get(category);
    if (!catKeys?.length) return [];
    return [
      {
        id: category,
        label: AMENITY_CATEGORY_LABELS[category],
        keys: prioritizeAmenityKeys(catKeys, "short_term"),
      },
    ];
  });
}

/** @deprecated Use amenitiesByCategoryGroups */
export function amenitiesByDisplayCategory(keys: string[]): AmenityDisplayGroup[] {
  return amenitiesByCategoryGroups(keys);
}

export function amenitiesByCategory(keys: string[]) {
  const grouped = new Map<AmenityCategory, string[]>();
  for (const key of keys.map(normalizeAmenityKey).filter(isKnownAmenityKey)) {
    const def = AMENITY_BY_KEY[key];
    if (!def) continue;
    const list = grouped.get(def.category) ?? [];
    list.push(def.label);
    grouped.set(def.category, list);
  }
  return grouped;
}

export function amenityLabel(key: string): string {
  const normalized = normalizeAmenityKey(key);
  return AMENITY_BY_KEY[normalized]?.label ?? key;
}

export function recommendedAmenityKeys(mode: "short_term" | "monthly"): readonly string[] {
  return mode === "monthly" ? MONTHLY_RECOMMENDED_KEYS : SHORT_TERM_RECOMMENDED_KEYS;
}

export const HIGHLIGHT_PRESETS: { label: string; icon_key: string }[] = [
  { label: "Self check-in", icon_key: "key" },
  { label: "Θέα στη θάλασσα", icon_key: "waves" },
  { label: "Δωρεάν parking", icon_key: "car" },
  { label: "3 λεπτά από μετρό", icon_key: "train" },
  { label: "Ιδανικό για οικογένειες", icon_key: "users" },
  { label: "Χώρος εργασίας", icon_key: "laptop" },
  { label: "Κοντά σε παραλία", icon_key: "umbrella" },
  { label: "Επιτρέπονται κατοικίδια", icon_key: "paw" },
  { label: "Ιδιωτική πισίνα", icon_key: "pool" },
  { label: "Ασανσέρ", icon_key: "elevator" },
  { label: "Κατάλληλο για μεγάλες παρέες", icon_key: "users" },
];

export const BED_TYPES = [
  "Διπλό κρεβάτι",
  "Μονό κρεβάτι",
  "Κουκέτα",
  "Καναπές-κρεβάτι",
  "Βρεφική κούνια",
  "Άλλο",
] as const;

export type BedType = (typeof BED_TYPES)[number];

export const PARKING_AMENITY_KEYS = new Set([
  "free_parking",
  "street_parking",
  "paid_parking_nearby",
  "private_parking",
  "garage_parking",
  "accessible_parking",
]);

export const FURNISHED_AMENITY_KEYS = new Set([
  "furnished",
  "partially_furnished",
]);

export const BILLS_AMENITY_KEYS = new Set([
  "bills_included",
  "electricity_included",
  "water_included",
  "internet_included",
  "common_charges_included",
  "heating_included",
]);
