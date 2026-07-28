import type { Listing, ListingAvailabilityStatus } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";

export type { ListingAvailabilityStatus };

export const LISTING_AVAILABILITY_STATUS_OPTIONS: {
  value: ListingAvailabilityStatus;
  label: string;
  labelKey: "statusAvailableNow" | "statusFromMonth" | "statusUponRequest";
}[] = [
  { value: "available_now", label: "Άμεσα διαθέσιμο", labelKey: "statusAvailableNow" },
  { value: "from_month", label: "Από συγκεκριμένο μήνα", labelKey: "statusFromMonth" },
  { value: "upon_request", label: "Κατόπιν συνεννόησης", labelKey: "statusUponRequest" },
];

export const DEFAULT_LISTING_AVAILABILITY_STATUS: ListingAvailabilityStatus =
  "available_now";

export function isListingAvailabilityStatus(
  value: string
): value is ListingAvailabilityStatus {
  return LISTING_AVAILABILITY_STATUS_OPTIONS.some((option) => option.value === value);
}

export function parseListingAvailabilityStatus(
  value: string | null | undefined
): ListingAvailabilityStatus {
  if (value && isListingAvailabilityStatus(value)) return value;
  return DEFAULT_LISTING_AVAILABILITY_STATUS;
}

const AVAILABILITY_STATUS_EN: Record<ListingAvailabilityStatus, string> = {
  available_now: "Available now",
  from_month: "From a specific month",
  upon_request: "By arrangement",
};

export function listingAvailabilityStatusLabel(
  status: ListingAvailabilityStatus,
  locale?: string
): string {
  const option = LISTING_AVAILABILITY_STATUS_OPTIONS.find((o) => o.value === status);
  return pickLocale(
    locale,
    option?.label ?? "Άμεσα διαθέσιμο",
    AVAILABILITY_STATUS_EN[status] ?? AVAILABILITY_STATUS_EN.available_now
  );
}

type AvailabilityFields = Pick<
  Listing,
  "availability_status" | "availability_note"
>;

export function formatListingAvailabilityText(
  listing: AvailabilityFields,
  t?: (
    key:
      | "availabilityAvailableNow"
      | "availabilityFromMonth"
      | "availabilityFromNote"
      | "availabilityUponRequest",
    values?: Record<string, string>
  ) => string,
  locale?: string
): string {
  const status = parseListingAvailabilityStatus(listing.availability_status);

  switch (status) {
    case "available_now":
      return t ? t("availabilityAvailableNow") : pickLocale(locale, "Άμεσα διαθέσιμο", "Available now");
    case "from_month": {
      const note = listing.availability_note?.trim();
      if (!note) {
        return t
          ? t("availabilityFromMonth")
          : pickLocale(locale, "Από συγκεκριμένο μήνα", "From a specific month");
      }
      if (t) return t("availabilityFromNote", { note });
      return note.toLowerCase().startsWith("από") || note.toLowerCase().startsWith("from")
        ? note.charAt(0).toUpperCase() + note.slice(1)
        : pickLocale(locale, `Από ${note}`, `From ${note}`);
    }
    case "upon_request":
      return t ? t("availabilityUponRequest") : pickLocale(locale, "Κατόπιν συνεννόησης", "By arrangement");
  }
}

export function formatListingAvailabilityLabel(
  listing: AvailabilityFields,
  locale?: string,
  t?: (key: "availabilityPrefix") => string
): string {
  const prefix = t ? t("availabilityPrefix") : pickLocale(locale, "Διαθεσιμότητα:", "Availability:");
  return `${prefix} ${formatListingAvailabilityText(listing, undefined, locale)}`;
}

const GREEK_MONTH_NAMES = [
  "Ιανουάριος",
  "Φεβρουάριος",
  "Μάρτιος",
  "Απρίλιος",
  "Μάιος",
  "Ιούνιος",
  "Ιούλιος",
  "Αύγουστος",
  "Σεπτέμβριος",
  "Οκτώβριος",
  "Νοέμβριος",
  "Δεκέμβριος",
] as const;

/** HTML month input value (YYYY-MM) → localized label for storage */
export function formatAvailabilityMonthNote(monthValue: string, locale = "el"): string {
  const [year, month] = monthValue.split("-");
  const idx = parseInt(month, 10) - 1;
  if (!year || idx < 0 || idx > 11) return monthValue;
  const date = new Date(parseInt(year, 10), idx, 1);
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "el-GR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Parse stored note or YYYY-MM into month input value */
export function parseAvailabilityMonthInput(note: string | null | undefined): string {
  if (!note?.trim()) return "";
  const trimmed = note.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\S+)\s+(\d{4})/);
  if (!match) return "";
  const idx = GREEK_MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === match[1].toLowerCase()
  );
  if (idx < 0) return "";
  return `${match[2]}-${String(idx + 1).padStart(2, "0")}`;
}
