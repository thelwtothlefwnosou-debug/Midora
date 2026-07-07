"use client";

import { ListingMediaGallery } from "@/components/listings/ListingMediaGallery";
import { MonthlyListingLayout } from "@/components/listings/MonthlyListingLayout";
import { ListingIdentityHeader } from "@/components/listings/detail/ListingIdentityHeader";
import { ListingHeaderIconActions } from "@/components/listings/detail/ListingHeaderActions";
import type { ListingPublicDetail, ListingWithImages } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import type { ListingPublicContact } from "@/lib/listing-contact";

type Props = {
  listing: ListingPublicDetail;
  unavailablePeriods: ListingUnavailablePeriod[];
  isFavorited: boolean;
  mapPrice: number;
  contact: ListingPublicContact;
  hostName?: string | null;
  similar?: ListingWithImages[];
};

export function MonthlyListingPageShell({
  listing,
  unavailablePeriods,
  isFavorited,
  mapPrice,
  contact,
  hostName,
  similar = [],
}: Props) {
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <>
      <ListingIdentityHeader
        listing={listing}
        rentalLabel="Μηνιαία / Μεσοπρόθεσμη"
        isFavorited={isFavorited}
        onShare={handleShare}
      />
      <div className="mt-6 overflow-hidden rounded-[20px]">
        <ListingMediaGallery
          images={listing.listing_images ?? []}
          title={listing.title}
          mobileActions={
            <ListingHeaderIconActions
              listingId={listing.id}
              listingTitle={listing.title}
              isFavorited={isFavorited}
              onShare={handleShare}
            />
          }
        />
      </div>
      <MonthlyListingLayout
        listing={listing}
        unavailablePeriods={unavailablePeriods}
        isFavorited={isFavorited}
        mapPrice={mapPrice}
        contact={contact}
        hostName={hostName}
        similar={similar}
      />
    </>
  );
}
