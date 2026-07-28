import type { AmenityCategory } from "@/lib/amenities-catalog-types";

/**
 * Curated wizard amenity sections for the create-listing amenities step.
 * ListingWizardAmenitiesStep renders these as always-visible multi-column cards;
 * popular chips still come from popularFilterAmenities(rentalMode).
 */
export type WizardAmenitySectionId =
  | "basic"
  | "kitchen"
  | "outdoor"
  | "access_parking"
  | "family"
  | "work_safety";

export type WizardAmenitySection = {
  id: WizardAmenitySectionId;
  /** @deprecated Labels resolve via `Wizard.amenities.sections.*` in UI. */
  label?: string;
  keys: readonly string[];
};

/** Popular chips shown first in the create-listing wizard. */
export const WIZARD_POPULAR_AMENITY_KEYS = [
  "wifi",
  "ac",
  "heating",
  "kitchen",
  "washer",
  "tv",
  "free_parking",
  "balcony",
  "workspace",
  "pets_allowed",
  "self_checkin",
  "private_pool",
] as const;

export const WIZARD_AMENITY_SECTIONS: WizardAmenitySection[] = [
  {
    id: "basic",
    keys: [
      "wifi",
      "ac",
      "heating",
      "hot_water",
      "tv",
      "washer",
      "dryer",
      "sheets",
      "towels",
      "personal_toiletries",
      "hair_dryer",
      "iron",
      "hangers",
    ],
  },
  {
    id: "kitchen",
    keys: [
      "kitchen",
      "refrigerator",
      "freezer",
      "oven",
      "microwave",
      "dishwasher",
      "coffee_maker",
      "kettle",
      "toaster",
      "cookware_and_dishes",
    ],
  },
  {
    id: "outdoor",
    keys: [
      "balcony",
      "yard",
      "bbq",
      "private_pool",
      "shared_pool",
      "hot_tub",
      "fireplace",
      "gym",
      "sauna",
    ],
  },
  {
    id: "access_parking",
    keys: [
      "free_parking",
      "street_parking",
      "private_parking",
      "elevator",
      "wheelchair_access",
      "ev_charger",
    ],
  },
  {
    id: "family",
    keys: [
      "kid_friendly",
      "crib",
      "high_chair",
      "pets_allowed",
      "self_checkin",
      "luggage_storage",
    ],
  },
  {
    id: "work_safety",
    keys: [
      "workspace",
      "ethernet",
      "smoke_detector",
      "co_detector",
      "fire_extinguisher",
      "first_aid",
    ],
  },
];

/** Map older category ids → wizard section (for editor grouping alignment). */
export const CATEGORY_TO_WIZARD_SECTION: Partial<
  Record<AmenityCategory, WizardAmenitySectionId>
> = {
  basic: "basic",
  bathroom: "basic",
  bedroom_laundry: "basic",
  entertainment: "basic",
  climate: "basic",
  kitchen_dining: "kitchen",
  outdoor: "outdoor",
  parking_facilities: "access_parking",
  accessibility: "access_parking",
  family: "family",
  services: "family",
  internet_work: "work_safety",
  safety: "work_safety",
};
