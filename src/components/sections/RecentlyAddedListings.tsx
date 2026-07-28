import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Search } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";
import { getHomepageRecentListings } from "@/lib/listings";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { getFavoriteListingIds } from "@/lib/user-features";
import { getHomepageListingBadges } from "@/lib/listing-badges";
import { pickHomepageListings } from "@/lib/homepage-listings";

export async function RecentlyAddedListings() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const [allListings, favoriteIds] = await Promise.all([
    getHomepageRecentListings(),
    getFavoriteListingIds(),
  ]);

  const listings = pickHomepageListings(allListings, 6);
  const favoriteSet = new Set(favoriteIds);
  const periodsMap = await getUnavailablePeriodsByListingIds(listings.map((l) => l.id));

  return (
    <section id="listings" className="home-section home-section--editorial home-bg-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title={t("featuredTitle")}
          subtitle={t("featuredSubtitlePlain")}
          action={
            listings.length > 0 ? (
              <Link href="/listings?rentalType=short_term" className="home-btn-secondary shrink-0">
                {t("featuredCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />

        {listings.length === 0 ? (
          <div className="rounded-[1.35rem] bg-white/70 px-6 py-14 text-center ring-1 ring-border/60">
            <p className="font-display text-lg font-semibold text-charcoal">
              {t("recentEmpty")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/listings?rentalType=short_term" className="home-btn-primary">
                <Search className="h-4 w-4" />
                {t("featuredCta")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {listings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  variant="home"
                  favorited={favoriteSet.has(listing.id)}
                  badges={getHomepageListingBadges(listing, locale)}
                  unavailablePeriods={periodsMap.get(listing.id) ?? []}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link href="/listings?rentalType=short_term" className="home-btn-secondary">
                {t("featuredCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
