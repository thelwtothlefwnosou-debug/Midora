import { createClient } from "@/lib/supabase/server";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { readStoredUnavailablePeriods, readStoredUnavailablePeriodsForListings } from "@/lib/unavailable-periods-storage";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export async function getOwnerUnavailablePeriods(
  listingId: string,
  ownerId: string
): Promise<ListingUnavailablePeriod[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_unavailable_periods")
    .select("*")
    .eq("listing_id", listingId)
    .eq("owner_id", ownerId)
    .order("start_date", { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      const stored = await readStoredUnavailablePeriods(listingId);
      return (stored ?? []).filter((p) => p.owner_id === ownerId);
    }
    console.error("[unavailable-periods]", error.message);
    return [];
  }

  if ((data ?? []).length > 0) return data as ListingUnavailablePeriod[];

  const stored = await readStoredUnavailablePeriods(listingId);
  return (stored ?? []).filter((p) => p.owner_id === ownerId);
}

export async function getPublicUnavailablePeriods(
  listingId: string
): Promise<ListingUnavailablePeriod[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const today = new Date().toISOString().slice(0, 10);

  // Public consumers only need date ranges — never expose external UIDs / calendar ids.
  const { data, error } = await supabase
    .from("listing_unavailable_periods")
    .select("id, listing_id, owner_id, start_date, end_date, reason, created_at, updated_at")
    .eq("listing_id", listingId)
    .gte("end_date", today)
    .order("start_date", { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      const stored = await readStoredUnavailablePeriods(listingId);
      return (stored ?? []).filter((p) => p.end_date >= today);
    }
    return [];
  }

  if ((data ?? []).length > 0) return data as ListingUnavailablePeriod[];

  const stored = await readStoredUnavailablePeriods(listingId);
  return (stored ?? []).filter((p) => p.end_date >= today);
}
/** Listing IDs that have at least one future/current unavailable period */
export async function getListingIdsWithUnavailablePeriods(
  listingIds: string[]
): Promise<Set<string>> {
  if (listingIds.length === 0) return new Set();

  const supabase = await createClient();
  if (!supabase) return new Set();

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("listing_unavailable_periods")
    .select("listing_id")
    .in("listing_id", listingIds)
    .gte("end_date", today);

  if (error) {
    if (isMissingTable(error)) {
      const storedMap = await readStoredUnavailablePeriodsForListings(listingIds);
      const today = new Date().toISOString().slice(0, 10);
      const set = new Set<string>();
      for (const [id, periods] of storedMap) {
        if (periods.some((p) => p.end_date >= today)) set.add(id);
      }
      return set;
    }
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.listing_id as string));
}

export async function getUnavailablePeriodsByListingIds(
  listingIds: string[]
): Promise<Map<string, ListingUnavailablePeriod[]>> {
  const map = new Map<string, ListingUnavailablePeriod[]>();
  if (listingIds.length === 0) return map;

  const supabase = await createClient();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("listing_unavailable_periods")
    .select("*")
    .in("listing_id", listingIds);

  if (error) {
    if (isMissingTable(error)) {
      return readStoredUnavailablePeriodsForListings(listingIds);
    }
    return map;
  }

  for (const row of data ?? []) {
    const period = row as ListingUnavailablePeriod;
    const list = map.get(period.listing_id) ?? [];
    list.push(period);
    map.set(period.listing_id, list);
  }
  return map;
}

export async function countOwnerUnavailablePeriods(ownerId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("listing_unavailable_periods")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return 0;
    return 0;
  }

  return count ?? 0;
}

export async function countUnavailablePeriodsByListingIds(
  listingIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!listingIds.length) return counts;

  const supabase = await createClient();
  if (!supabase) return counts;

  const { data, error } = await supabase
    .from("listing_unavailable_periods")
    .select("listing_id")
    .in("listing_id", listingIds);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return counts;
    return counts;
  }

  for (const row of data ?? []) {
    const id = row.listing_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}
