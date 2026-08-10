/**
 * Free Hosting (Δωρεάν Φιλοξενία) — discovery + matching helpers.
 *
 * Offers live on short_term listings only. No third rental type.
 * Canonical window: [startDate, endExclusive) — same as iCal / stay nights.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getListingById } from "@/lib/listings";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import {
  offerHasOpenNight,
  requestedNightsWithinMax,
  requestedStayFitsOffer,
  type FreeHostingDateRange,
  type FreeHostingOfferStatus,
} from "@/lib/free-hosting-match";
import { stayRangeHasBlockedNight } from "@/lib/listing-short-term-price";
import type { ListingWithImages } from "@/lib/types";
import {
  FREE_HOSTING_OWNER_OFFER_HREF,
  FREE_HOSTING_QUERY_PARAM,
  FREE_STAYS_PATH,
  freeHostingListingsHref,
} from "@/lib/free-hosting-paths";

export type { FreeHostingDateRange, FreeHostingOfferStatus };

export type FreeHostingOfferRow = {
  id: string;
  listingId: string;
  startDate: string;
  endExclusive: string;
  maxNights: number;
  maxGuests: number;
  ownerMessage: string | null;
  status: FreeHostingOfferStatus;
};

/** Public card/preview shape once offers exist in DB. */
export type FreeHostingPublicOffer = FreeHostingOfferRow & {
  listing: ListingWithImages;
};

export {
  FREE_STAYS_PATH,
  FREE_HOSTING_QUERY_PARAM,
  FREE_HOSTING_OWNER_OFFER_HREF,
  freeHostingListingsHref,
};

export const FREE_HOSTING_MAX_ACTIVE_GUEST_REQUESTS = 3;

export {
  requestedStayFitsOffer,
  requestedNightsWithinMax,
  offerHasOpenNight,
  suggestStayWithinOffer,
  offerMatchesRequestedStay,
} from "@/lib/free-hosting-match";

function isMigrationMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("listing_free_hosting_offers") ||
    msg.includes("schema cache")
  );
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapOfferRow(row: {
  id: string;
  listing_id: string;
  start_date: string;
  end_exclusive: string;
  max_nights: number;
  max_guests: number;
  owner_message: string | null;
  status: string;
}): FreeHostingOfferRow {
  return {
    id: row.id,
    listingId: row.listing_id,
    startDate: row.start_date,
    endExclusive: row.end_exclusive,
    maxNights: row.max_nights,
    maxGuests: row.max_guests,
    ownerMessage: row.owner_message,
    status: row.status as FreeHostingOfferStatus,
  };
}

async function fetchActiveOfferRows(limit?: number): Promise<FreeHostingOfferRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("listing_free_hosting_offers")
    .select(
      "id, listing_id, start_date, end_exclusive, max_nights, max_guests, owner_message, status"
    )
    .eq("status", "active")
    .gt("end_exclusive", todayYmd())
    .order("start_date", { ascending: true });

  if (limit != null && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    if (isMigrationMissing(error)) return [];
    console.error("[free-hosting] fetch offers:", error.message);
    return [];
  }

  return (data ?? []).map(mapOfferRow);
}

export async function getActiveFreeHostingOffersForListing(
  listingId: string
): Promise<FreeHostingOfferRow[]> {
  if (!listingId || !isSupabaseConfigured()) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_free_hosting_offers")
    .select(
      "id, listing_id, start_date, end_exclusive, max_nights, max_guests, owner_message, status"
    )
    .eq("listing_id", listingId)
    .eq("status", "active")
    .gt("end_exclusive", todayYmd())
    .order("start_date", { ascending: true });

  if (error) {
    if (isMigrationMissing(error)) return [];
    return [];
  }

  return (data ?? []).map(mapOfferRow);
}

export async function getActiveFreeHostingOffers(
  limit = 6
): Promise<FreeHostingPublicOffer[]> {
  const rows = await fetchActiveOfferRows(Math.max(limit * 3, limit));
  if (rows.length === 0) return [];

  const listingIds = [...new Set(rows.map((r) => r.listingId))];
  const periodsMap = await getUnavailablePeriodsByListingIds(listingIds);

  const openRows = rows.filter((row) =>
    offerHasOpenNight(row, periodsMap.get(row.listingId) ?? [])
  );

  const out: FreeHostingPublicOffer[] = [];
  const seenListings = new Set<string>();

  for (const row of openRows) {
    if (out.length >= limit) break;
    if (seenListings.has(row.listingId)) continue;

    const listing = await getListingById(row.listingId);
    if (!listing || listing.status !== "approved" || listing.rental_type !== "short_term") {
      continue;
    }

    seenListings.add(row.listingId);
    out.push({ ...row, listing });
  }

  return out;
}

export async function countActiveFreeHostingOffers(): Promise<number> {
  const ids = await getMatchingFreeHostingListingIds({});
  return ids.length;
}

/**
 * Listing IDs with at least one matching active free-hosting offer
 * (optional date/guest filters + unavailable conflict check).
 */
export async function getMatchingFreeHostingListingIds(opts: {
  interestFrom?: string;
  interestTo?: string;
  guests?: number;
} = {}): Promise<string[]> {
  const rows = await fetchActiveOfferRows();
  if (rows.length === 0) return [];

  const listingIds = [...new Set(rows.map((r) => r.listingId))];
  const periodsMap = await getUnavailablePeriodsByListingIds(listingIds);
  const matched = new Set<string>();

  const from = opts.interestFrom?.trim() || undefined;
  const to = opts.interestTo?.trim() || undefined;
  const guests =
    opts.guests != null && Number.isFinite(opts.guests) && opts.guests > 0
      ? opts.guests
      : undefined;

  for (const row of rows) {
    if (guests != null && row.maxGuests < guests) continue;

    const periods = periodsMap.get(row.listingId) ?? [];

    if (from && to) {
      if (!requestedStayFitsOffer(from, to, row)) continue;
      if (!requestedNightsWithinMax(from, to, row.maxNights)) continue;
      if (stayRangeHasBlockedNight(from, to, periods)) continue;
      matched.add(row.listingId);
      continue;
    }

    if (offerHasOpenNight(row, periods)) {
      matched.add(row.listingId);
    }
  }

  return [...matched];
}
