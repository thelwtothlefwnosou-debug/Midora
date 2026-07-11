"use client";

import { Suspense, useMemo } from "react";
import { ListingRentalModeSwitcher } from "@/components/listings/ListingRentalModeSwitcher";
import { ListingMediaGallery } from "@/components/listings/ListingMediaGallery";
import { MonthlyListingLayout } from "@/components/listings/MonthlyListingLayout";
import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import { ListingSleepingSection } from "@/components/listings/short-term/ListingShortTermSections";
import { ListingAreaSection } from "@/components/listings/short-term/ListingAreaSection";
import { ListingAdvertiserSection } from "@/components/listings/short-term/ListingAdvertiserSection";
import { SimilarListingsSection } from "@/components/listings/short-term/SimilarListingsSection";
import { ListingIdentityHeader } from "@/components/listings/detail/ListingIdentityHeader";
import { StickyPropertyNav } from "@/components/listings/detail/StickyPropertyNav";
import { ShortTermInquiryCard } from "@/components/listings/detail/ShortTermInquiryCard";
import { AvailabilityCalendarSection } from "@/components/listings/detail/AvailabilityCalendarSection";
import { ListingLegalSection } from "@/components/listings/detail/ListingLegalSection";
import { ListingCoreContent } from "@/components/listings/detail/ListingCoreContent";
import { ListingPhotoTourSection } from "@/components/listings/detail/ListingPhotoTourSection";
import { ListingArrivalSection } from "@/components/listings/detail/ListingArrivalSection";
import { ListingHeaderIconActions } from "@/components/listings/detail/ListingHeaderActions";
import { ListingInquiryDatesProvider } from "@/components/listings/detail/ListingInquiryDatesContext";
import { hasArrivalInfo } from "@/lib/listing-arrival";
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
  previewMode?: boolean;
};

function ListingPageContentInner({
  listing,
  similar,
  unavailablePeriods,
  isFavorited,
  contact,
  previewMode = false,
}: Props) {
  const { mode, showBoth } = useListingRentalMode();

  const stickyNavItems = useMemo(() => {
    const items = [
      { id: "about", label: "Περιγραφή" },
      { id: "amenities", label: "Παροχές" },
    ];
    const hasTour = (listing.listing_images ?? []).some((img) => img.media_type !== "video");
    if (hasTour) items.push({ id: "photo-tour", label: "Περιήγηση" });
    if (hasArrivalInfo(listing)) items.push({ id: "arrival", label: "Άφιξη" });
    items.push({ id: "availability", label: "Διαθεσιμότητα" });
    items.push({ id: "area", label: "Περιοχή" });
    return items;
  }, [listing]);

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

      <ListingPhotoTourSection listing={listing} images={listing.listing_images ?? []} />
      <ListingArrivalSection listing={listing} />

      <StickyPropertyNav items={stickyNavItems} />

      <div className="mt-6 grid gap-12 lg:grid-cols-3 lg:gap-10">
        <div className="min-w-0 space-y-0 lg:col-span-2">
          <AvailabilityCalendarSection listing={listing} periods={unavailablePeriods} />
          <ListingAreaSection listing={listing} />
          <ListingSleepingSection
            arrangements={listing.sleeping_arrangements}
            images={listing.listing_images ?? []}
          />
          <ListingAdvertiserSection listing={listing} />
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
