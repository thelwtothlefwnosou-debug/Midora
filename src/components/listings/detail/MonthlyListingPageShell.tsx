"use client";



import { ListingMediaGallery } from "@/components/listings/ListingMediaGallery";

import { MonthlyListingLayout } from "@/components/listings/MonthlyListingLayout";

import { PublicListingTitleRow } from "@/components/listings/detail/PublicListingTitleRow";

import { PublicListingSummary } from "@/components/listings/detail/PublicListingSummary";

import { ListingHeaderIconActions } from "@/components/listings/detail/ListingHeaderActions";

import { NearbyListingsCarouselFromUrl } from "@/components/listings/detail/NearbyListingsCarouselSlot";

import type { ListingPublicDetail, ListingWithImages, ListingCohostWithProfile, ListingContactNumber } from "@/lib/types";

import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

import type { ListingPublicContact } from "@/lib/listing-contact";



type Props = {

  listing: ListingPublicDetail;

  unavailablePeriods: ListingUnavailablePeriod[];

  isFavorited: boolean;

  mapPrice: number;

  contact: ListingPublicContact;

  hostName?: string | null;

  nearby?: ListingWithImages[];

  previewMode?: boolean;

};



export function MonthlyListingPageShell({

  listing,

  unavailablePeriods,

  isFavorited,

  mapPrice,

  contact,

  hostName,

  nearby = [],

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

      <PublicListingTitleRow

        listing={listing}

        isFavorited={isFavorited}

        onShare={handleShare}

      />

      <div className="mt-4 overflow-hidden rounded-[20px] lg:mt-5">

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

      <PublicListingSummary listing={listing} rentalLabel="Μηνιαία / Μεσοπρόθεσμη" />

      <MonthlyListingLayout

        listing={listing}

        unavailablePeriods={unavailablePeriods}

        isFavorited={isFavorited}

        mapPrice={mapPrice}

        contact={contact}

        hostName={hostName}

      />

      <div className="mt-2 border-t border-border pt-2">

        <NearbyListingsCarouselFromUrl

          currentListingId={listing.id}

          listings={nearby}

          rentalMode="monthly"

        />

      </div>

    </>

  );

}

