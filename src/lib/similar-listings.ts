import { createClient } from "@/lib/supabase/server";
import type { ListingWithImages } from "@/lib/types";
import { listingSupportsShortTerm } from "@/lib/rental-types";
import { isSearchQualityListing } from "@/lib/search-listing-quality";

export async function getSimilarListings(
  listing: ListingWithImages,
  limit = 6
): Promise<ListingWithImages[]> {
  if (!listingSupportsShortTerm(listing)) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const expiresFilter = `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;
  const nightPrice = listing.price_per_night ?? listing.price_monthly;
  const minPrice = Math.round(nightPrice * 0.7);
  const maxPrice = Math.round(nightPrice * 1.3);

  const query = supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("status", "approved")
    .eq("is_hidden", false)
    .neq("id", listing.id)
    .or(expiresFilter)
    .eq("city", listing.city)
    .gte("price_per_night", minPrice)
    .lte("price_per_night", maxPrice)
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  const { data, error } = await query;

  if (error || !data?.length) {
    const fallback = await supabase
      .from("listings")
      .select("*, listing_images(*)")
      .eq("status", "approved")
      .eq("is_hidden", false)
      .neq("id", listing.id)
      .or(expiresFilter)
      .eq("city", listing.city)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fallback.error || !fallback.data?.length) return [];
    return rankSimilar(listing, fallback.data as ListingWithImages[], limit);
  }

  return rankSimilar(listing, data as ListingWithImages[], limit);
}

function rankSimilar(
  source: ListingWithImages,
  candidates: ListingWithImages[],
  limit: number
): ListingWithImages[] {
  const srcNight = source.price_per_night ?? source.price_monthly;
  const srcGuests = source.max_guests ?? 2;

  const scored = candidates
    .filter((c) => listingSupportsShortTerm(c))
    .filter((c) => isSearchQualityListing(c))
    .map((c) => {
      let score = 0;
      if (c.area === source.area) score += 4;
      if (c.property_type === source.property_type) score += 2;
      const guestDiff = Math.abs((c.max_guests ?? 2) - srcGuests);
      score += Math.max(0, 3 - guestDiff);
      const price = c.price_per_night ?? c.price_monthly;
      const priceDiff = Math.abs(price - srcNight) / Math.max(srcNight, 1);
      score += Math.max(0, 3 - priceDiff * 5);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.c);
}
