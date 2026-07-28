import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthlyPriceTier } from "@/lib/listing-monthly-price";

export async function replaceListingMonthlyPriceTiers(
  supabase: SupabaseClient,
  listingId: string,
  ownerId: string,
  tiers: MonthlyPriceTier[]
): Promise<{ error?: string }> {
  const { error: delError } = await supabase
    .from("listing_monthly_price_tiers")
    .delete()
    .eq("listing_id", listingId)
    .eq("owner_id", ownerId);

  if (delError) {
    if (
      delError.message.includes("does not exist") ||
      delError.message.includes("Could not find")
    ) {
      return {};
    }
    return { error: delError.message };
  }

  if (!tiers.length) return {};

  const rows = tiers.map((tier, index) => ({
    listing_id: listingId,
    owner_id: ownerId,
    people_from: tier.people_from,
    people_to: tier.people_to,
    monthly_price: tier.monthly_price,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from("listing_monthly_price_tiers")
    .insert(rows);

  if (insertError) {
    if (
      insertError.message.includes("does not exist") ||
      insertError.message.includes("Could not find")
    ) {
      return {};
    }
    return { error: insertError.message };
  }

  return {};
}

export async function getListingMonthlyPriceTiers(
  listingId: string
): Promise<MonthlyPriceTier[]> {
  const map = await getMonthlyPriceTiersByListingIds([listingId]);
  return map[listingId] ?? [];
}

export async function getMonthlyPriceTiersByListingIds(
  listingIds: string[]
): Promise<Record<string, MonthlyPriceTier[]>> {
  const ids = [...new Set(listingIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("listing_monthly_price_tiers")
    .select("listing_id, people_from, people_to, monthly_price, sort_order")
    .in("listing_id", ids)
    .order("sort_order")
    .order("people_from");

  if (error || !data) return {};

  const map: Record<string, MonthlyPriceTier[]> = {};
  for (const row of data) {
    const listingId = row.listing_id as string;
    if (!map[listingId]) map[listingId] = [];
    map[listingId].push({
      people_from: row.people_from,
      people_to: row.people_to,
      monthly_price: row.monthly_price,
    });
  }
  return map;
}

export async function attachMonthlyPriceTiersToListings<
  T extends {
    id: string;
    monthly_pricing_mode?: string | null;
    monthly_price_tiers?: MonthlyPriceTier[] | null;
  },
>(listings: T[]): Promise<T[]> {
  const needsTiers = listings.filter(
    (l) =>
      l.monthly_pricing_mode === "tiers" &&
      !(l.monthly_price_tiers && l.monthly_price_tiers.length > 0)
  );
  if (needsTiers.length === 0) return listings;

  const map = await getMonthlyPriceTiersByListingIds(needsTiers.map((l) => l.id));
  return listings.map((listing) => {
    if (listing.monthly_pricing_mode !== "tiers") return listing;
    if (listing.monthly_price_tiers && listing.monthly_price_tiers.length > 0) {
      return listing;
    }
    return {
      ...listing,
      monthly_price_tiers: map[listing.id] ?? [],
    };
  });
}
