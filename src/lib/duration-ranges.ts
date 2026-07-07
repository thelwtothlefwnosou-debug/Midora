export type SearchDurationValue =
  | "1plus"
  | "2-3"
  | "4-6"
  | "6-12"
  | "12plus";

export const SEARCH_DURATION_OPTIONS: {
  value: SearchDurationValue;
  label: string;
}[] = [
  { value: "1plus", label: "1+ μήνας" },
  { value: "2-3", label: "2–3 μήνες" },
  { value: "4-6", label: "4–6 μήνες" },
  { value: "6-12", label: "6–12 μήνες" },
  { value: "12plus", label: "12+ μήνες" },
];

export const DEFAULT_SEARCH_DURATION: SearchDurationValue = "1plus";

export function isSearchDurationValue(value: string): value is SearchDurationValue {
  return SEARCH_DURATION_OPTIONS.some((option) => option.value === value);
}

export function parseSearchDurationParam(
  raw: string | undefined
): SearchDurationValue | undefined {
  if (!raw?.trim()) return undefined;
  const value = raw.trim();
  return isSearchDurationValue(value) ? value : undefined;
}

/** Listing is compatible when its minimum stay fits the user's desired range. */
export function durationRangeToMaxListingMinMonths(
  duration: SearchDurationValue
): number | undefined {
  switch (duration) {
    case "1plus":
      return 1;
    case "2-3":
      return 3;
    case "4-6":
      return 6;
    case "6-12":
      return 12;
    case "12plus":
      return undefined;
  }
}

export function searchDurationLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const found = SEARCH_DURATION_OPTIONS.find((option) => option.value === value);
  return found?.label ?? value;
}
