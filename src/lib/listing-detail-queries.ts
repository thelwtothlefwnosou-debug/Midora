import { createClient } from "@/lib/supabase/server";
import type {
  ListingHighlight,
  ListingPriceRule,
  ListingPublicDetail,
  ListingAmenityRow,
  ListingWithImages,
} from "@/lib/types";
import { getListingById } from "@/lib/listings";
import { getPublicSleepingArrangements } from "@/lib/listing-sleeping-arrangements";
import {
  resolvePublicAmenityRows,
  resolvePublicHighlights,
} from "@/lib/listing-public-amenities";
import { getPublicListingExternalLinks } from "@/lib/listing-external-links-db";
import { getListingMonthlyPriceTiers } from "@/lib/listing-monthly-tiers-db";

import { PROFILE_CONTACT_SELECT } from "@/lib/profile-contact-select";

const LISTING_SELECT =
  `*, listing_images(*), profiles(${PROFILE_CONTACT_SELECT})` as const;

async function safeSelect<T>(
  table: string,
  listingId: string,
  orderCol: string
): Promise<T[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("listing_id", listingId)
    .order(orderCol);

  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("Could not find")) {
      return [];
    }
    console.error(`[listing-detail] ${table}:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export async function getPublicPriceRules(listingId: string): Promise<ListingPriceRule[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_price_rules")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date");

  if (error) return [];
  return (data ?? []) as ListingPriceRule[];
}

export async function getAdvertiserActiveListingCount(userId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "approved")
    .eq("is_hidden", false);

  return count ?? 0;
}

export async function getListingPublicDetail(
  id: string,
  locale?: string
): Promise<ListingPublicDetail | null> {
  const listing = await getListingById(id);
  if (!listing) return null;

  const [highlights, sleeping, amenities, price_rules, advertiser_active_listings, external_links, monthly_price_tiers] =
    await Promise.all([
      safeSelect<ListingHighlight>("listing_highlights", listing.id, "sort_order"),
      getPublicSleepingArrangements(listing.id),
      safeSelect<ListingAmenityRow>("listing_amenities", listing.id, "sort_order"),
      getPublicPriceRules(listing.id),
      getAdvertiserActiveListingCount(listing.user_id),
      getPublicListingExternalLinks(listing.id),
      listing.monthly_pricing_mode === "tiers"
        ? getListingMonthlyPriceTiers(listing.id)
        : Promise.resolve(listing.monthly_price_tiers ?? []),
    ]);

  const resolvedAmenities = resolvePublicAmenityRows(listing, amenities);
  const resolvedHighlights = resolvePublicHighlights({
    ...listing,
    highlights,
  }, locale);

  return {
    ...listing,
    monthly_price_tiers,
    highlights: resolvedHighlights,
    sleeping_arrangements: sleeping,
    amenities: resolvedAmenities,
    price_rules,
    advertiser_active_listings,
    external_links,
  };
}
