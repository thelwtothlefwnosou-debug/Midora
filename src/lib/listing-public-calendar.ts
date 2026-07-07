import { parseListingAvailabilityStatus } from "@/lib/listing-availability-status";
import type { ListingPublicDetail } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

/** Whether the public detail page should show an indicative availability calendar. */
export function listingHasPublicCalendarData(
  listing: Pick<ListingPublicDetail, "availability_status" | "price_rules">,
  periods: ListingUnavailablePeriod[]
): boolean {
  if (periods.length > 0) return true;
  if ((listing.price_rules?.length ?? 0) > 0) return true;

  const status = parseListingAvailabilityStatus(listing.availability_status);
  return status === "available_now" || status === "from_month";
}
