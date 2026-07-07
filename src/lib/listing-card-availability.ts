import {
  addDays,
  isDateUnavailable,
  todayDateKey,
} from "@/lib/availability-calendar";
import {
  parseAvailabilityMonthInput,
  parseListingAvailabilityStatus,
} from "@/lib/listing-availability-status";
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

/** "Available 07 Jul 2026" — matches Blueground card copy. */
export function formatListingCardAvailabilityLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const day = String(d).padStart(2, "0");
  const month = new Date(y, m - 1, d).toLocaleDateString("en-GB", { month: "short" });
  return `Available ${day} ${month} ${y}`;
}

export function getListingCardAvailabilityLabel(
  listing: ListingAvailabilityFields,
  periods: PeriodSlim[] = []
): string | null {
  const dateKey = resolveListingCardAvailabilityDate(listing, periods);
  if (!dateKey) return null;
  return formatListingCardAvailabilityLabel(dateKey);
}
