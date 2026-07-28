import { Suspense } from "react";
import { ListingDetailScrollFix } from "@/components/listings/detail/ListingDetailScrollFix";
import { ListingBackToSearchLink } from "@/components/listings/detail/ListingBackToSearchLink";
import { ListingDetailHeader } from "@/components/listings/detail/ListingDetailHeader";
import { Footer } from "@/components/layout/Footer";
import { getListingPublicDetail } from "@/lib/listing-detail-queries";
import { getNearbyListings } from "@/lib/nearby-listings";
import { getFavoriteListingIds } from "@/lib/user-features";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { resolveListingPublicContact } from "@/lib/listing-contact";
import { getPublicUnavailablePeriods } from "@/lib/unavailable-periods-db";
import { isPublicMvpListing } from "@/lib/rental-types";
import { defaultPublicRentalMode, publicPricePrimary, resolveSupportsShortTerm } from "@/lib/listing-rental-modes";
import { isListingActive } from "@/lib/listings";
import { ListingInterestProvider } from "@/components/listings/ListingInterestContext";
import { ListingRentalModeProvider } from "@/components/listings/ListingRentalModeContext";
import { ListingInterestBridge } from "@/components/listings/ListingInterestBridge";
import { ListingViewTracker } from "@/components/listings/ListingViewTracker";
import { ListingPageContent } from "@/components/listings/short-term/ListingPageContent";
import { MonthlyListingPageShell } from "@/components/listings/detail/MonthlyListingPageShell";
import { notFound } from "next/navigation";
import { getAcceptedPublicCohosts } from "@/lib/listing-cohosts-db";
import { getPublicListingContactNumbers } from "@/lib/listing-contact-numbers-db";
import { ListingJsonLd } from "@/components/seo/ListingJsonLd";
import { getLocale, getTranslations } from "next-intl/server";

export async function ListingDetailBody({ id }: { id: string }) {
  const t = await getTranslations("Listing");
  const locale = await getLocale();
  const listing = await getListingPublicDetail(id, locale);

  if (!listing || !isListingActive(listing) || !isPublicMvpListing(listing)) {
    notFound();
  }

  const favoriteIds = await getFavoriteListingIds();
  const isFavorited = favoriteIds.includes(listing.id);
  const unavailablePeriods = await getPublicUnavailablePeriods(listing.id);
  const [nearby, publicCohosts, publicContactPhones] = await Promise.all([
    getNearbyListings(listing, {
      rentalMode: defaultPublicRentalMode(listing),
    }),
    getAcceptedPublicCohosts(listing.id),
    getPublicListingContactNumbers(listing.id),
  ]);

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
      <ListingJsonLd listing={listing} canonicalPath={canonicalPath} locale={locale} />
      <ListingRentalModeProvider listing={listing}>
        <ListingDetailScrollFix />
        <ListingDetailHeader />
        <main className="listing-detail min-h-screen bg-white pt-[4.25rem] pb-28 lg:pb-16">
          <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 lg:pt-4">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <Suspense
                fallback={
                  <span className="inline-flex min-h-7 items-center gap-1.5 text-sm text-muted">
                    {t("backToSearch")}
                  </span>
                }
              >
                <ListingBackToSearchLink />
              </Suspense>
            </div>

            {isShortCapable ? (
              <ListingPageContent
                listing={listing}
                nearby={nearby}
                unavailablePeriods={unavailablePeriods}
                isFavorited={isFavorited}
                mapPrice={mapPrice}
                contact={contact}
                publicCohosts={publicCohosts}
                publicContactPhones={publicContactPhones}
              />
            ) : (
              <MonthlyListingPageShell
                listing={listing}
                unavailablePeriods={unavailablePeriods}
                isFavorited={isFavorited}
                mapPrice={mapPrice}
                contact={contact}
                hostName={hostName}
                nearby={nearby}
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
