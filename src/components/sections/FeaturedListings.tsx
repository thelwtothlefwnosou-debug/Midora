import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { getApprovedListings, getApprovedListingsCount } from "@/lib/listings";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { getFavoriteListingIds } from "@/lib/user-features";

function periodsForListings(
  map: Map<string, { start_date: string; end_date: string }[]>,
  listingId: string
) {
  return map.get(listingId) ?? [];
}

export async function FeaturedListings() {
  const [listings, total, favoriteIds] = await Promise.all([
    getApprovedListings({}, 6),
    getApprovedListingsCount(),
    getFavoriteListingIds(),
  ]);

  const periodsMap = await getUnavailablePeriodsByListingIds(listings.map((l) => l.id));

  const favoriteSet = new Set(favoriteIds);

  return (
    <section id="listings" className="relative bg-cream py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
              Επιλεγμένα ακίνητα
            </h2>
            <p className="mt-2 text-muted">
              {total}+ αγγελίες σε όλη την Ελλάδα — βραχυχρόνια και μηνιαία/μεσοπρόθεσμη
            </p>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark transition-colors hover:text-gold"
          >
            Δες όλα τα ακίνητα
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={i}
              favorited={favoriteSet.has(listing.id)}
              unavailablePeriods={periodsForListings(periodsMap, listing.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
