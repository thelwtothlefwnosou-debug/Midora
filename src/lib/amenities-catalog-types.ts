export type AmenityCategory =
  | "basic"
  | "bathroom"
  | "bedroom_laundry"
  | "entertainment"
  | "family"
  | "climate"
  | "safety"
  | "internet_work"
  | "kitchen_dining"
  | "location_features"
  | "outdoor"
  | "parking_facilities"
  | "accessibility"
  | "services"
  | "monthly_terms";

export type RentalModeScope = "short_term" | "monthly" | "both";

export type AmenityDef = {
  key: string;
  label: string;
  category: AmenityCategory;
  modes: RentalModeScope;
  isPopularFilterShort?: boolean;
  isPopularFilterMonthly?: boolean;
  isSafetyFeature?: boolean;
  isAccessibilityFeature?: boolean;
  sortOrder: number;
};

export type AmenityDisplayGroup = {
  id: AmenityCategory;
  label: string;
  keys: string[];
};
