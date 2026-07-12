import {
  addDays,
  meetsMinimumStayNights,
  todayDateKey,
} from "@/lib/availability-calendar";
import {
  computeIndicativeStayPrice,
  INDICATIVE_DEFAULT_NIGHTS,
  stayRangeHasBlockedNight,
  type ShortTermPricingConfig,
} from "@/lib/listing-short-term-price";
import type { ListingPriceRule } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

export type DefaultStayRange = {
  checkIn: string;
  checkOut: string;
  nights: number;
  source: "default-preview";
};

const MAX_SEARCH_DAYS = 120;

function isSelectableFiveNightWindow(
  checkIn: string,
  checkOut: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[],
  minimumStayNights: number
): boolean {
  if (checkIn < todayDateKey()) return false;
  if (stayRangeHasBlockedNight(checkIn, checkOut, periods)) return false;
  return meetsMinimumStayNights(checkIn, checkOut, minimumStayNights);
}

/**
 * First available consecutive default stay window (5 nights by default).
 * checkOut is exclusive (standard stay checkout day).
 */
export function getDefaultFiveNightRange(
  listing: ShortTermPricingConfig,
  rules: ListingPriceRule[] = [],
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = [],
  minimumStayNights = 1,
  guests = 2,
  nights = INDICATIVE_DEFAULT_NIGHTS
): DefaultStayRange | null {
  const targetNights = Math.max(nights, minimumStayNights);
  const today = todayDateKey();

  for (let offset = 1; offset <= MAX_SEARCH_DAYS; offset++) {
    const checkIn = addDays(today, offset);
    const checkOut = addDays(checkIn, targetNights);

    if (!isSelectableFiveNightWindow(checkIn, checkOut, periods, minimumStayNights)) {
      continue;
    }

    const price = computeIndicativeStayPrice(
      listing,
      rules,
      checkIn,
      checkOut,
      guests,
      periods
    );
    if (!price) continue;

    return {
      checkIn,
      checkOut,
      nights: targetNights,
      source: "default-preview",
    };
  }

  const checkInToday = today;
  const checkOutToday = addDays(checkInToday, targetNights);
  if (
    isSelectableFiveNightWindow(checkInToday, checkOutToday, periods, minimumStayNights) &&
    computeIndicativeStayPrice(listing, rules, checkInToday, checkOutToday, guests, periods)
  ) {
    return {
      checkIn: checkInToday,
      checkOut: checkOutToday,
      nights: targetNights,
      source: "default-preview",
    };
  }

  return null;
}
