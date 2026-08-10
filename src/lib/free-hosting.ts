/**
 * Free Hosting (Δωρεάν Φιλοξενία) — product constants & read stubs.
 *
 * Offers live on short_term listings only. No third rental type.
 * Real persistence lands after schema approval (listing_free_hosting_offers).
 */

import type { ListingWithImages } from "@/lib/types";

export type FreeHostingOfferStatus = "draft" | "active" | "paused" | "ended";

/** Canonical stay window: [startDate, endExclusive) — same as iCal / short-term. */
export type FreeHostingDateRange = {
  startDate: string;
  endExclusive: string;
};

/** Public card/preview shape once offers exist in DB. */
export type FreeHostingPublicOffer = {
  id: string;
  listingId: string;
  listing: ListingWithImages;
  startDate: string;
  endExclusive: string;
  maxNights: number;
  maxGuests: number;
  ownerMessage: string | null;
};

export const FREE_STAYS_PATH = "/free-stays";
export const FREE_HOSTING_QUERY_PARAM = "freeHosting";

/** Owner deep-link once calendar UI ships; until then owners hub. */
export const FREE_HOSTING_OWNER_OFFER_HREF = "/dashboard/listings?intent=free-hosting";

export function freeHostingListingsHref(extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    rentalType: "short_term",
    [FREE_HOSTING_QUERY_PARAM]: "true",
    ...extra,
  });
  return `/listings?${params.toString()}`;
}

/**
 * Until migration: no persisted offers.
 * Homepage + /free-stays must render clean empty / informational states.
 */
export async function getActiveFreeHostingOffers(_limit = 6): Promise<FreeHostingPublicOffer[]> {
  return [];
}

export async function countActiveFreeHostingOffers(): Promise<number> {
  return 0;
}

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
  const from = Date.parse(`${requestedFrom}T12:00:00`);
  const to = Date.parse(`${requestedToExclusive}T12:00:00`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return false;
  const nights = Math.round((to - from) / 86_400_000);
  return nights >= 1 && nights <= maxNights;
}
