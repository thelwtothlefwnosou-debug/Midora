import { pickLocale } from "@/lib/locale-fallbacks";

export type SearchDurationValue =
  | "1plus"
  | "2-3"
  | "4-6"
  | "6-12"
  | "12plus";

export const SEARCH_DURATION_OPTIONS: {
  value: SearchDurationValue;
  label: string;
  labelKey: string;
}[] = [
  { value: "1plus", label: "1+ μήνας", labelKey: "duration1plus" },
  { value: "2-3", label: "2–3 μήνες", labelKey: "duration2_3" },
  { value: "4-6", label: "4–6 μήνες", labelKey: "duration4_6" },
  { value: "6-12", label: "6–12 μήνες", labelKey: "duration6_12" },
  { value: "12plus", label: "12+ μήνες", labelKey: "duration12plus" },
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

const SEARCH_DURATION_FALLBACK_EN: Record<SearchDurationValue, string> = {
  "1plus": "1+ month",
  "2-3": "2–3 months",
  "4-6": "4–6 months",
  "6-12": "6–12 months",
  "12plus": "12+ months",
};

export function searchDurationLabel(
  value: string | null | undefined,
  locale?: string
): string {
  if (!value) return "—";
  if (isSearchDurationValue(value)) {
    return pickLocale(locale, SEARCH_DURATION_OPTIONS.find((o) => o.value === value)!.label, SEARCH_DURATION_FALLBACK_EN[value]);
  }
  const found = SEARCH_DURATION_OPTIONS.find((option) => option.value === value);
  return found?.label ?? value;
}
