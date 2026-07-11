import { ListingPreviewEmbedChrome } from "@/components/dashboard/listing-preview/ListingPreviewEmbedChrome";
import { ListingPageContent } from "@/components/listings/short-term/ListingPageContent";
import { MonthlyListingPageShell } from "@/components/listings/detail/MonthlyListingPageShell";
import { ListingInterestProvider } from "@/components/listings/ListingInterestContext";
import { ListingRentalModeProvider } from "@/components/listings/ListingRentalModeContext";
import { ListingPreviewModeProvider } from "@/components/listings/ListingPreviewModeContext";
import { resolveListingPublicContact } from "@/lib/listing-contact";
import { defaultPublicRentalMode, publicPricePrimary, resolveSupportsShortTerm } from "@/lib/listing-rental-modes";
import type { ListingPublicDetail, ListingWithImages } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  unavailablePeriods: ListingUnavailablePeriod[];
  similar: ListingWithImages[];
  embed?: boolean;
};

export function ListingOwnerPreviewBody({
  listing,
  unavailablePeriods,
  similar,
  embed = false,
}: Props) {
  const contact = resolveListingPublicContact(listing, listing.profiles ?? null);
  const mapPrice = publicPricePrimary(listing, defaultPublicRentalMode(listing)).amount;
  const isShortCapable = resolveSupportsShortTerm(listing);
  const hostName = listing.profiles?.full_name;

  return (
    <ListingPreviewModeProvider enabled>
      {embed ? <ListingPreviewEmbedChrome /> : null}
      <ListingInterestProvider>
        <ListingRentalModeProvider listing={listing}>
          <main
            className={cn(
              "listing-detail overflow-x-hidden bg-white",
              embed ? "pb-24 pt-2" : "pb-28 pt-4 lg:pb-16"
            )}
          >
            <div className={cn("mx-auto max-w-6xl", embed ? "px-3" : "px-4 sm:px-6")}>
              {isShortCapable ? (
                <ListingPageContent
                  listing={listing}
                  similar={similar}
                  unavailablePeriods={unavailablePeriods}
                  isFavorited={false}
                  mapPrice={mapPrice}
                  contact={contact}
                  previewMode
                />
              ) : (
                <MonthlyListingPageShell
                  listing={listing}
                  unavailablePeriods={unavailablePeriods}
                  isFavorited={false}
                  mapPrice={mapPrice}
                  contact={contact}
                  hostName={hostName}
                  similar={similar}
                  previewMode
                />
              )}
            </div>
          </main>
        </ListingRentalModeProvider>
      </ListingInterestProvider>
    </ListingPreviewModeProvider>
  );
}
