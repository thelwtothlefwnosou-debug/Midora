/**
 * Pure Free Hosting match helpers (safe for client + server).
 */

import { addDays, stayNightsBetween } from "@/lib/availability-calendar";
import {
  isDateBlocked,
  stayRangeHasBlockedNight,
} from "@/lib/listing-short-term-price";

/** Canonical stay window: [startDate, endExclusive). */
export type FreeHostingDateRange = {
  startDate: string;
  endExclusive: string;
};

export type FreeHostingOfferStatus = "draft" | "active" | "paused" | "ended";

export type FreeHostingOfferMatchInput = FreeHostingDateRange & {
  maxNights: number;
  maxGuests: number;
};

/** Half-open: requested [from, to) must fit entirely inside offer [start, endExclusive). */
export function requestedStayFitsOffer(
  requestedFrom: string,
  requestedToExclusive: string,
  offer: FreeHostingDateRange
): boolean {
  return requestedFrom >= offer.startDate && requestedToExclusive <= offer.endExclusive;
}

export function requestedNightsWithinMax(
  requestedFrom: string,
  requestedToExclusive: string,
  maxNights: number
): boolean {
  const nights = stayNightsBetween(requestedFrom, requestedToExclusive);
  return nights >= 1 && nights <= maxNights;
}

export function offerHasOpenNight(
  offer: FreeHostingDateRange,
  periods: { start_date: string; end_date: string }[]
): boolean {
  const nights = stayNightsBetween(offer.startDate, offer.endExclusive);
  for (let i = 0; i < nights; i++) {
    const night = addDays(offer.startDate, i);
    if (!isDateBlocked(night, periods)) return true;
  }
  return false;
}

export function suggestStayWithinOffer(offer: {
  startDate: string;
  endExclusive: string;
  maxNights: number;
}): { start: string; end: string } | null {
  const offerNights = stayNightsBetween(offer.startDate, offer.endExclusive);
  if (offerNights < 1) return null;
  const nights = Math.min(offer.maxNights, offerNights);
  return {
    start: offer.startDate,
    end: addDays(offer.startDate, nights),
  };
}

export function offerMatchesRequestedStay(
  offer: FreeHostingOfferMatchInput,
  requestedFrom: string,
  requestedToExclusive: string,
  guests: number | undefined,
  periods: { start_date: string; end_date: string }[]
): boolean {
  if (guests != null && offer.maxGuests < guests) return false;
  if (!requestedStayFitsOffer(requestedFrom, requestedToExclusive, offer)) return false;
  if (!requestedNightsWithinMax(requestedFrom, requestedToExclusive, offer.maxNights)) {
    return false;
  }
  if (stayRangeHasBlockedNight(requestedFrom, requestedToExclusive, periods)) return false;
  return true;
}
