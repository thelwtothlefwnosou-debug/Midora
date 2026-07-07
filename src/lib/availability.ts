import type { Listing } from "@/lib/types";
import {
  formatListingAvailabilityText,
  parseListingAvailabilityStatus,
} from "@/lib/listing-availability-status";

export { formatListingAvailabilityLabel } from "@/lib/listing-availability-status";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
};

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(`${value.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addMonthsToDate(dateStr: string, months: number): string {
  const d = parseDateOnly(dateStr);
  if (!d) return dateStr;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function formatDateEl(dateStr: string | null | undefined): string {
  const d = parseDateOnly(dateStr ?? undefined);
  if (!d) return "";
  return d.toLocaleDateString("el-GR", DATE_FMT);
}

export function formatDateRangeEl(from: string, to: string): string {
  const a = parseDateOnly(from);
  const b = parseDateOnly(to);
  if (!a || !b) return formatDateEl(from) || formatDateEl(to);

  const sameMonth =
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

  if (sameMonth) {
    return `${a.getDate()}–${b.toLocaleDateString("el-GR", DATE_FMT)}`;
  }

  return `${a.toLocaleDateString("el-GR", DATE_FMT)} – ${b.toLocaleDateString("el-GR", DATE_FMT)}`;
}

function usesLegacyAvailabilityDates(
  listing: Pick<Listing, "availability_status" | "available_from" | "available_until">
): boolean {
  return (
    !listing.availability_status &&
    Boolean(listing.available_from || listing.available_until)
  );
}

/** Ελέγχει αν το ακίνητο δέχεται διαμονή moveIn για N μήνες */
export function isListingAvailableForStay(
  listing: Pick<
    Listing,
    | "availability_status"
    | "available_from"
    | "available_until"
    | "min_months"
  >,
  moveIn: string,
  months: number
): boolean {
  if (months < listing.min_months) return false;

  if (!usesLegacyAvailabilityDates(listing)) {
    return true;
  }

  const start = parseDateOnly(moveIn);
  if (!start) return true;

  const moveOutStr = addMonthsToDate(moveIn, months);
  const end = parseDateOnly(moveOutStr);
  if (!end) return false;

  const availFrom = parseDateOnly(listing.available_from ?? undefined);
  const availUntil = parseDateOnly(listing.available_until ?? undefined);

  if (availFrom && start < availFrom) return false;
  if (availUntil && end > availUntil) return false;

  return true;
}

/** Κείμενο διαθεσιμότητας για κάρτα / λίστα */
export function formatListingAvailability(
  listing: Pick<
    Listing,
    | "availability_status"
    | "availability_note"
    | "available_from"
    | "available_until"
    | "min_months"
  >,
  options?: { moveIn?: string; months?: number }
): string {
  const { moveIn, months } = options ?? {};

  if (moveIn && months) {
    if (isListingAvailableForStay(listing, moveIn, months)) {
      const moveOut = addMonthsToDate(moveIn, months);
      return formatDateRangeEl(moveIn, moveOut);
    }
    return "Μη διαθέσιμο";
  }

  if (!usesLegacyAvailabilityDates(listing)) {
    return formatListingAvailabilityText(listing);
  }

  const today = todayDateString();
  const from = listing.available_from;
  const until = listing.available_until;

  if (from && until) {
    if (from <= today && until >= today) {
      return formatDateRangeEl(today, until);
    }
    if (from > today) {
      return `Από ${formatDateEl(from)}`;
    }
    return `Έως ${formatDateEl(until)}`;
  }

  if (from && from > today) {
    return `Διαθέσιμο από ${formatDateEl(from)}`;
  }

  if (until) {
    if (until >= today) {
      return `Διαθέσιμο έως ${formatDateEl(until)}`;
    }
    return "Μη διαθέσιμο";
  }

  return formatListingAvailabilityText({
    availability_status: parseListingAvailabilityStatus(listing.availability_status),
    availability_note: listing.availability_note,
  });
}

export function isListingCurrentlyAvailable(
  listing: Pick<
    Listing,
    "availability_status" | "availability_note" | "available_from" | "available_until"
  >
): boolean {
  if (!usesLegacyAvailabilityDates(listing)) {
    return true;
  }

  const today = todayDateString();
  if (listing.available_from && listing.available_from > today) return false;
  if (listing.available_until && listing.available_until < today) return false;
  return true;
}
