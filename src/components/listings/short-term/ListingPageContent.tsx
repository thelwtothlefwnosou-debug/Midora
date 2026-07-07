"use client";

import { Suspense } from "react";
import { ListingRentalModeSwitcher } from "@/components/listings/ListingRentalModeSwitcher";
import { ListingMediaGallery } from "@/components/listings/ListingMediaGallery";
import { MonthlyListingLayout } from "@/components/listings/MonthlyListingLayout";
import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import { ListingSleepingSection } from "@/components/listings/short-term/ListingShortTermSections";
import { ListingAreaSection } from "@/components/listings/short-term/ListingAreaSection";
import { SimilarListingsSection } from "@/components/listings/short-term/SimilarListingsSection";
import { ListingIdentityHeader } from "@/components/listings/detail/ListingIdentityHeader";
import { StickyPropertyNav } from "@/components/listings/detail/StickyPropertyNav";
import { ShortTermInquiryCard } from "@/components/listings/detail/ShortTermInquiryCard";
import { AvailabilityCalendarSection } from "@/components/listings/detail/AvailabilityCalendarSection";
import { ListingLegalSection } from "@/components/listings/detail/ListingLegalSection";
import { ListingCoreContent } from "@/components/listings/detail/ListingCoreContent";
import { ListingHeaderIconActions } from "@/components/listings/detail/ListingHeaderActions";
import { ListingInquiryDatesProvider } from "@/components/listings/detail/ListingInquiryDatesContext";
import type { ListingPublicDetail, ListingWithImages } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import type { ListingPublicContact } from "@/lib/listing-contact";

type Props = {
  listing: ListingPublicDetail;
  similar: ListingWithImages[];
  unavailablePeriods: ListingUnavailablePeriod[];
  isFavorited: boolean;
  mapPrice: number;
  contact: ListingPublicContact;
};

function ListingPageContentInner({
  listing,
  similar,
  unavailablePeriods,
  isFavorited,
  contact,
}: Props) {
  const { mode, showBoth } = useListingRentalMode();

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

  const gallery = (
    <div id="gallery" className="mt-6 overflow-hidden rounded-[20px]">
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
  );

  if (mode === "monthly") {
    return (
      <>
        <ListingIdentityHeader
          listing={listing}
          rentalLabel="Μηνιαία / Μεσοπρόθεσμη"
          isFavorited={isFavorited}
          onShare={handleShare}
          modeSwitcher={showBoth ? <ListingRentalModeSwitcher /> : undefined}
        />
        {gallery}
        <MonthlyListingLayout
          listing={listing}
          unavailablePeriods={unavailablePeriods}
          isFavorited={isFavorited}
          mapPrice={0}
          contact={contact}
          hostName={listing.profiles?.full_name}
          similar={similar}
        />
      </>
    );
  }

  return (
    <>
      <ListingIdentityHeader
        listing={listing}
        rentalLabel="Βραχυχρόνια"
        isFavorited={isFavorited}
        onShare={handleShare}
        modeSwitcher={showBoth ? <ListingRentalModeSwitcher /> : undefined}
      />

      {gallery}

      <ListingCoreContent listing={listing} rentalMode="short_term" />

      <StickyPropertyNav showAvailability />

      <div className="mt-6 grid gap-12 lg:grid-cols-3 lg:gap-10">
        <div className="min-w-0 space-y-0 lg:col-span-2">
          <AvailabilityCalendarSection listing={listing} periods={unavailablePeriods} />
          <ListingAreaSection listing={listing} />
          <ListingSleepingSection
            arrangements={listing.sleeping_arrangements}
            images={listing.listing_images ?? []}
          />
          <SimilarListingsSection listings={similar} />
          <ListingLegalSection listing={listing} />
        </div>

        <Suspense fallback={null}>
          <ShortTermInquiryCard
            listing={listing}
            periods={unavailablePeriods}
            contact={contact}
          />
        </Suspense>
      </div>
    </>
  );
}

export function ListingPageContent(props: Props) {
  return (
    <ListingInquiryDatesProvider listing={props.listing}>
      <ListingPageContentInner {...props} />
    </ListingInquiryDatesProvider>
  );
}
