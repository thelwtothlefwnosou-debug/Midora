import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";
import { getHomepageRecentListings } from "@/lib/listings";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { getFavoriteListingIds } from "@/lib/user-features";
import { getHomepageListingBadges } from "@/lib/listing-badges";
import { pickHomepageListings } from "@/lib/homepage-listings";

export async function RecentlyAddedListings() {
  const [allListings, favoriteIds] = await Promise.all([
    getHomepageRecentListings(),
    getFavoriteListingIds(),
  ]);

  const listings = pickHomepageListings(allListings, 6);
  const favoriteSet = new Set(favoriteIds);
  const periodsMap = await getUnavailablePeriodsByListingIds(listings.map((l) => l.id));

  return (
    <section id="listings" className="home-section home-bg-sand border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title="Πρόσφατα ακίνητα"
          subtitle="Νέες αγγελίες που προστέθηκαν πρόσφατα στο Midora."
          action={
            listings.length > 0 ? (
              <Link href="/listings" className="home-btn-secondary shrink-0">
                Δες όλα τα ακίνητα
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />

        {listings.length === 0 ? (
          <div className="home-card home-card-muted px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold text-charcoal">
              Νέες αγγελίες έρχονται σύντομα
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Εξερεύνησε τις διαθέσιμες αγγελίες ή ανέβασε τη δική σου.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/listings" className="home-btn-primary">
                <Search className="h-4 w-4" />
                Δες όλες τις αγγελίες
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={i}
                variant="home"
                favorited={favoriteSet.has(listing.id)}
                badges={getHomepageListingBadges(listing)}
                unavailablePeriods={periodsMap.get(listing.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
