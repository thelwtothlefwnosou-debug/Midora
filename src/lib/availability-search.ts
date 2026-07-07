import type { Listing } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { periodsOverlap } from "@/lib/unavailable-periods";
import { listingRentalType } from "@/lib/rental-types";

export function listingOverlapsUnavailable(
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[],
  requestedFrom: string,
  requestedTo: string
): boolean {
  return periods.some((p) =>
    periodsOverlap(p.start_date, p.end_date, requestedFrom, requestedTo)
  );
}

export function filterListingsByAvailability<
  T extends { id: string }
>(
  listings: T[],
  periodsByListingId: Map<string, Pick<ListingUnavailablePeriod, "start_date" | "end_date">[]>,
  requestedFrom: string,
  requestedTo: string
): T[] {
  return listings.filter((listing) => {
    const periods = periodsByListingId.get(listing.id) ?? [];
    if (periods.length === 0) return true;
    return !listingOverlapsUnavailable(periods, requestedFrom, requestedTo);
  });
}

export type ListingAvailabilityHint =
  | "no_overlap_for_period"
  | "contact_for_availability"
  | "has_unavailable_periods";

export function getListingAvailabilityHint(
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[],
  searchRange: { from: string; to: string } | null
): ListingAvailabilityHint {
  if (periods.length === 0) return "contact_for_availability";
  if (!searchRange) return "has_unavailable_periods";
  if (listingOverlapsUnavailable(periods, searchRange.from, searchRange.to)) {
    return "has_unavailable_periods";
  }
  return "no_overlap_for_period";
}

export const AVAILABILITY_HINT_LABELS: Record<ListingAvailabilityHint, string> = {
  no_overlap_for_period: "Δεν έχει δηλωθεί μη διαθεσιμότητα για την περίοδο",
  contact_for_availability: "Διαθεσιμότητα κατόπιν επικοινωνίας",
  has_unavailable_periods: "Έχει δηλωμένες μη διαθέσιμες περίοδους",
};

export function formatAvailableFromMonth(availableFrom: string): string {
  const month = availableFrom.slice(0, 7);
  const [y, m] = month.split("-");
  if (!y || !m) return availableFrom;
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric" }).format(d);
}

/** Card hint text — rental-type aware (short-term date search vs monthly/long-term). */
export function getListingAvailabilityDisplay(
  listing: Pick<Listing, "rental_type" | "available_from">,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[],
  searchRange: { from: string; to: string } | null
): string {
  const rentalType = listingRentalType(listing);

  if (rentalType === "short_term") {
    return AVAILABILITY_HINT_LABELS[getListingAvailabilityHint(periods, searchRange)];
  }

  if (!searchRange && listing.available_from?.trim()) {
    return `Διαθέσιμο από ${formatAvailableFromMonth(listing.available_from)}`;
  }

  if (periods.length === 0) {
    return AVAILABILITY_HINT_LABELS.contact_for_availability;
  }

  if (!searchRange) {
    return AVAILABILITY_HINT_LABELS.has_unavailable_periods;
  }

  return AVAILABILITY_HINT_LABELS[getListingAvailabilityHint(periods, searchRange)];
}
