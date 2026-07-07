import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListingDetailHeader } from "@/components/listings/detail/ListingDetailHeader";
import { Footer } from "@/components/layout/Footer";
import { getListingPublicDetail } from "@/lib/listing-detail-queries";
import { getSimilarListings } from "@/lib/similar-listings";
import { getFavoriteListingIds } from "@/lib/user-features";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { resolveListingPublicContact } from "@/lib/listing-contact";
import { getPublicUnavailablePeriods } from "@/lib/unavailable-periods-db";
import { isPublicMvpListing } from "@/lib/rental-types";
import { defaultPublicRentalMode, publicPricePrimary } from "@/lib/listing-rental-modes";
import { isListingActive } from "@/lib/listings";
import { ListingInterestProvider } from "@/components/listings/ListingInterestContext";
import { ListingRentalModeProvider } from "@/components/listings/ListingRentalModeContext";
import { ListingInterestBridge } from "@/components/listings/ListingInterestBridge";
import { ListingViewTracker } from "@/components/listings/ListingViewTracker";
import { ListingPageContent } from "@/components/listings/short-term/ListingPageContent";
import { MonthlyListingPageShell } from "@/components/listings/detail/MonthlyListingPageShell";
import { resolveSupportsShortTerm } from "@/lib/listing-rental-modes";
import { notFound } from "next/navigation";
import { ListingJsonLd } from "@/components/seo/ListingJsonLd";

export async function ListingDetailBody({ id }: { id: string }) {
  const listing = await getListingPublicDetail(id);

  if (!listing || !isListingActive(listing) || !isPublicMvpListing(listing)) {
    notFound();
  }

  const favoriteIds = await getFavoriteListingIds();
  const isFavorited = favoriteIds.includes(listing.id);
  const unavailablePeriods = await getPublicUnavailablePeriods(listing.id);
  const similar = await getSimilarListings(listing);

  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const profile = user ? await getCurrentProfile() : null;
  const defaultContact = {
    name: profile?.full_name ?? undefined,
    email: user?.email ?? undefined,
    phone: profile?.phone ?? undefined,
  };

  const contact = resolveListingPublicContact(listing, listing.profiles ?? null);
  const hostName = listing.profiles?.full_name;

  const mapPrice = publicPricePrimary(listing, defaultPublicRentalMode(listing)).amount;
  const isShortCapable = resolveSupportsShortTerm(listing);
  const canonicalPath = `/listings/${listing.slug ?? listing.id}`;

  return (
    <ListingInterestProvider>
      <ListingJsonLd listing={listing} canonicalPath={canonicalPath} />
      <ListingRentalModeProvider listing={listing}>
        <ListingDetailHeader />
        <main className="listing-detail min-h-screen overflow-x-hidden bg-white pt-[4.25rem] pb-28 lg:pb-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Link
              href="/listings"
              className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Πίσω στα ακίνητα
            </Link>

            {isShortCapable ? (
              <ListingPageContent
                listing={listing}
                similar={similar}
                unavailablePeriods={unavailablePeriods}
                isFavorited={isFavorited}
                mapPrice={mapPrice}
                contact={contact}
              />
            ) : (
              <MonthlyListingPageShell
                listing={listing}
                unavailablePeriods={unavailablePeriods}
                isFavorited={isFavorited}
                mapPrice={mapPrice}
                contact={contact}
                hostName={hostName}
                similar={similar}
              />
            )}
          </div>
        </main>
        <Footer />
        <ListingInterestBridge listing={listing} defaultContact={defaultContact} />
        <ListingViewTracker listingId={listing.id} />
      </ListingRentalModeProvider>
    </ListingInterestProvider>
  );
}
