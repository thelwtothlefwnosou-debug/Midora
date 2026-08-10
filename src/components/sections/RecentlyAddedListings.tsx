import { getLocale } from "next-intl/server";
import { RecentlyAddedListingsClient } from "@/components/sections/RecentlyAddedListingsClient";
import { getHomepageRecentListings } from "@/lib/listings";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { getFavoriteListingIds } from "@/lib/user-features";
import { getHomepageListingBadges } from "@/lib/listing-badges";
import { pickHomepageListingsByMode } from "@/lib/homepage-listings";

export async function RecentlyAddedListings() {
  const locale = await getLocale();
  const [allListings, favoriteIds] = await Promise.all([
    getHomepageRecentListings(),
    getFavoriteListingIds(),
  ]);

  // Newest pools per mode are cached; shuffle runs here so cards rotate per request.
  const shortTerm = pickHomepageListingsByMode(allListings, "short_term", 6);
  const monthly = pickHomepageListingsByMode(allListings, "monthly", 6);

  const visible = [...shortTerm, ...monthly];
  const periodsMap = await getUnavailablePeriodsByListingIds(visible.map((l) => l.id));

  const badgesByListingId = Object.fromEntries(
    visible.map((listing) => [listing.id, getHomepageListingBadges(listing, locale)])
  );

  const periodsByListingId = Object.fromEntries(
    visible.map((listing) => [listing.id, periodsMap.get(listing.id) ?? []])
  );

  return (
    <RecentlyAddedListingsClient
      shortTerm={shortTerm}
      monthly={monthly}
      favoriteIds={favoriteIds}
      badgesByListingId={badgesByListingId}
      periodsByListingId={periodsByListingId}
    />
  );
}
