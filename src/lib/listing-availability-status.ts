import type { Listing, ListingAvailabilityStatus } from "@/lib/types";

export type { ListingAvailabilityStatus };

export const LISTING_AVAILABILITY_STATUS_OPTIONS: {
  value: ListingAvailabilityStatus;
  label: string;
}[] = [
  { value: "available_now", label: "Άμεσα διαθέσιμο" },
  { value: "from_month", label: "Από συγκεκριμένο μήνα" },
  { value: "upon_request", label: "Κατόπιν συνεννόησης" },
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

export function listingAvailabilityStatusLabel(
  status: ListingAvailabilityStatus
): string {
  return (
    LISTING_AVAILABILITY_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? "Άμεσα διαθέσιμο"
  );
}

type AvailabilityFields = Pick<
  Listing,
  "availability_status" | "availability_note"
>;

export function formatListingAvailabilityText(
  listing: AvailabilityFields
): string {
  const status = parseListingAvailabilityStatus(listing.availability_status);

  switch (status) {
    case "available_now":
      return "Άμεσα διαθέσιμο";
    case "from_month": {
      const note = listing.availability_note?.trim();
      if (!note) return "Από συγκεκριμένο μήνα";
      return note.toLowerCase().startsWith("από")
        ? note.charAt(0).toUpperCase() + note.slice(1)
        : `Από ${note}`;
    }
    case "upon_request":
      return "Κατόπιν συνεννόησης";
  }
}

export function formatListingAvailabilityLabel(
  listing: AvailabilityFields
): string {
  return `Διαθεσιμότητα: ${formatListingAvailabilityText(listing)}`;
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

/** HTML month input value (YYYY-MM) → Greek label for storage */
export function formatAvailabilityMonthNote(monthValue: string): string {
  const [year, month] = monthValue.split("-");
  const idx = parseInt(month, 10) - 1;
  if (!year || idx < 0 || idx > 11) return monthValue;
  return `${GREEK_MONTH_NAMES[idx]} ${year}`;
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
