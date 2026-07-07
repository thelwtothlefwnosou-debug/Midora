export type AmenityCategory =
  | "basic"
  | "spaces"
  | "access"
  | "safety"
  | "accessibility";

export type AmenityDef = {
  key: string;
  label: string;
  category: AmenityCategory;
};

export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  basic: "Βασικές",
  spaces: "Χώροι",
  access: "Πρόσβαση",
  safety: "Ασφάλεια",
  accessibility: "Προσβασιμότητα",
};

/** Public detail modal — richer category labels */
export const AMENITY_MODAL_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  basic: "Βασικές παροχές",
  spaces: "Εξωτερικοί χώροι",
  access: "Parking και πρόσβαση",
  safety: "Ασφάλεια",
  accessibility: "Προσβασιμότητα",
};

const KITCHEN_AMENITY_KEYS = new Set(["kitchen", "washer", "bbq"]);
const WORK_AMENITY_KEYS = new Set(["workspace"]);
const COMFORT_AMENITY_KEYS = new Set([
  "tv",
  "ac",
  "heating",
  "wifi",
  "hair_dryer",
  "iron",
  "linens",
]);

export type AmenityDisplayGroup = {
  id: string;
  label: string;
  keys: string[];
};

const MONTHLY_AMENITY_PRIORITY = [
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
] as const;

const SHORT_TERM_AMENITY_PRIORITY = [
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
] as const;

export function prioritizeAmenityKeys(
  keys: string[],
  mode: "short_term" | "monthly" = "short_term"
): string[] {
  const priority = mode === "monthly" ? MONTHLY_AMENITY_PRIORITY : SHORT_TERM_AMENITY_PRIORITY;
  const rank = new Map(priority.map((key, index) => [key, index]));
  return [...keys].sort((a, b) => {
    const ra = rank.get(a as (typeof priority)[number]) ?? 999;
    const rb = rank.get(b as (typeof priority)[number]) ?? 999;
    if (ra !== rb) return ra - rb;
    return amenityLabel(a).localeCompare(amenityLabel(b), "el");
  });
}

export function amenitiesByDisplayCategory(keys: string[]): AmenityDisplayGroup[] {
  const kitchen: string[] = [];
  const comfort: string[] = [];
  const work: string[] = [];
  const grouped = new Map<AmenityCategory, string[]>();

  for (const key of keys) {
    const def = AMENITY_BY_KEY[key];
    if (!def) continue;
    if (KITCHEN_AMENITY_KEYS.has(key)) {
      kitchen.push(key);
      continue;
    }
    if (WORK_AMENITY_KEYS.has(key)) {
      work.push(key);
      continue;
    }
    if (COMFORT_AMENITY_KEYS.has(key)) {
      comfort.push(key);
      continue;
    }
    const list = grouped.get(def.category) ?? [];
    list.push(key);
    grouped.set(def.category, list);
  }

  const sections: AmenityDisplayGroup[] = [];
  if (kitchen.length) sections.push({ id: "kitchen", label: "Κουζίνα", keys: kitchen });
  if (comfort.length) {
    sections.push({ id: "comfort", label: "Άνεση και ψυχαγωγία", keys: comfort });
  }
  if (work.length) sections.push({ id: "work", label: "Εργασία", keys: work });

  const categoryOrder: AmenityCategory[] = ["basic", "spaces", "access", "safety", "accessibility"];
  for (const cat of categoryOrder) {
    const catKeys = grouped.get(cat);
    if (!catKeys?.length) continue;
    sections.push({
      id: cat,
      label: AMENITY_MODAL_CATEGORY_LABELS[cat],
      keys: catKeys,
    });
  }

  return sections;
}

export const AMENITIES_CATALOG: AmenityDef[] = [
  { key: "wifi", label: "WiFi", category: "basic" },
  { key: "ac", label: "Κλιματισμός", category: "basic" },
  { key: "heating", label: "Θέρμανση", category: "basic" },
  { key: "washer", label: "Πλυντήριο", category: "basic" },
  { key: "kitchen", label: "Κουζίνα", category: "basic" },
  { key: "tv", label: "Τηλεόραση", category: "basic" },
  { key: "workspace", label: "Χώρος εργασίας", category: "basic" },
  { key: "iron", label: "Σίδερο", category: "basic" },
  { key: "hair_dryer", label: "Πιστολάκι", category: "basic" },
  { key: "linens", label: "Λευκά είδη", category: "basic" },
  { key: "balcony", label: "Μπαλκόνι", category: "spaces" },
  { key: "view", label: "Θέα", category: "spaces" },
  { key: "garden", label: "Κήπος", category: "spaces" },
  { key: "pool", label: "Πισίνα", category: "spaces" },
  { key: "yard", label: "Αυλή", category: "spaces" },
  { key: "terrace", label: "Ταράτσα", category: "spaces" },
  { key: "bbq", label: "BBQ", category: "spaces" },
  { key: "elevator", label: "Ασανσέρ", category: "access" },
  { key: "free_parking", label: "Δωρεάν parking", category: "access" },
  { key: "street_parking", label: "Parking κοντά", category: "access" },
  { key: "ground_floor", label: "Ισόγειο", category: "access" },
  { key: "self_checkin", label: "Self check-in", category: "access" },
  { key: "smoke_detector", label: "Ανιχνευτής καπνού", category: "safety" },
  { key: "fire_extinguisher", label: "Πυροσβεστήρας", category: "safety" },
  { key: "first_aid", label: "Φαρμακείο", category: "safety" },
  { key: "outdoor_lighting", label: "Εξωτερικός φωτισμός εισόδου", category: "safety" },
  { key: "step_free", label: "Πρόσβαση χωρίς σκαλοπάτια", category: "accessibility" },
  { key: "accessible_elevator", label: "Ανελκυστήρας", category: "accessibility" },
  { key: "accessible_bathroom", label: "Προσβάσιμο μπάνιο", category: "accessibility" },
  { key: "accessible_entrance", label: "Προσβάσιμη είσοδος", category: "accessibility" },
];

export const AMENITY_BY_KEY = Object.fromEntries(
  AMENITIES_CATALOG.map((a) => [a.key, a])
) as Record<string, AmenityDef>;

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

export function amenityLabel(key: string): string {
  return AMENITY_BY_KEY[key]?.label ?? key;
}

export function amenitiesByCategory(keys: string[]) {
  const grouped = new Map<AmenityCategory, string[]>();
  for (const key of keys) {
    const def = AMENITY_BY_KEY[key];
    if (!def) continue;
    const list = grouped.get(def.category) ?? [];
    list.push(def.label);
    grouped.set(def.category, list);
  }
  return grouped;
}
