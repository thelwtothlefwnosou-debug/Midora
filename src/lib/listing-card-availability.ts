import {
  addDays,
  isDateUnavailable,
  todayDateKey,
} from "@/lib/availability-calendar";
import {
  parseAvailabilityMonthInput,
  parseListingAvailabilityStatus,
} from "@/lib/listing-availability-status";
import { intlLocale, pickLocale } from "@/lib/locale-fallbacks";
import { listingRentalType } from "@/lib/rental-types";
import type { Listing } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

const MAX_LOOKAHEAD_DAYS = 366;

type ListingAvailabilityFields = Pick<
  Listing,
  "rental_type" | "availability_status" | "availability_note" | "available_from"
>;

type PeriodSlim = Pick<ListingUnavailablePeriod, "start_date" | "end_date">;

export function findNextAvailableDateKey(
  periods: PeriodSlim[] = [],
  fromDateKey?: string
): string | null {
  let key = fromDateKey ?? todayDateKey();
  for (let i = 0; i < MAX_LOOKAHEAD_DAYS; i++) {
    if (!isDateUnavailable(key, periods)) return key;
    key = addDays(key, 1);
  }
  return null;
}

function resolveEarliestAvailabilityStart(
  listing: ListingAvailabilityFields
): string {
  const today = todayDateKey();

  if (listing.available_from?.trim() && listing.available_from > today) {
    return listing.available_from;
  }

  const status = parseListingAvailabilityStatus(listing.availability_status);
  if (status === "from_month") {
    const monthInput = parseAvailabilityMonthInput(listing.availability_note);
    if (monthInput) {
      const firstOfMonth = `${monthInput}-01`;
      if (firstOfMonth > today) return firstOfMonth;
    }
  }

  return today;
}

/** Next check-in date for card overlay (Blueground-style). */
export function resolveListingCardAvailabilityDate(
  listing: ListingAvailabilityFields,
  periods: PeriodSlim[] = []
): string | null {
  const status = parseListingAvailabilityStatus(listing.availability_status);

  if (status === "upon_request" && !listing.available_from?.trim()) {
    return null;
  }

  const startFrom = resolveEarliestAvailabilityStart(listing);
  const rentalType = listingRentalType(listing);

  if (rentalType === "short_term") {
    return findNextAvailableDateKey(periods, startFrom);
  }

  if (status === "upon_request") return null;
  if (startFrom > todayDateKey()) return startFrom;
  return todayDateKey();
}

function parseDateKeyParts(dateKey: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

/** Locale-aware card overlay: "Διαθέσιμο από 28 Ιουλ 2026" / "Available from 28 Jul 2026". */
export function formatListingCardAvailabilityLabel(
  dateKey: string,
  locale?: string
): string | null {
  const parts = parseDateKeyParts(dateKey);
  if (!parts) return null;

  const date = new Date(parts.y, parts.m - 1, parts.d);
  const month = new Intl.DateTimeFormat(intlLocale(locale), { month: "short" })
    .format(date)
    .replace(/\.$/, "")
    .trim();
  if (!month) return null;

  const dateText = `${parts.d} ${month} ${parts.y}`;
  return pickLocale(
    locale,
    `Διαθέσιμο από ${dateText}`,
    `Available from ${dateText}`
  );
}

export function getListingCardAvailabilityLabel(
  listing: ListingAvailabilityFields,
  periods: PeriodSlim[] = [],
  locale?: string
): string | null {
  const dateKey = resolveListingCardAvailabilityDate(listing, periods);
  if (!dateKey) return null;
  return formatListingCardAvailabilityLabel(dateKey, locale);
}
