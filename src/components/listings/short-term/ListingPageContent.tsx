"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ListingRentalModeSwitcher } from "@/components/listings/ListingRentalModeSwitcher";
import { ListingMediaGallery } from "@/components/listings/ListingMediaGallery";
import { MonthlyListingLayout } from "@/components/listings/MonthlyListingLayout";
import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import { ListingSleepingSection } from "@/components/listings/short-term/ListingShortTermSections";
import { ListingAreaSection } from "@/components/listings/short-term/ListingAreaSection";
import { ListingAdvertiserSection } from "@/components/listings/short-term/ListingAdvertiserSection";
import { NearbyListingsCarouselSlot } from "@/components/listings/detail/NearbyListingsCarouselSlot";
import { PublicListingTitleRow } from "@/components/listings/detail/PublicListingTitleRow";
import { PublicListingSummary } from "@/components/listings/detail/PublicListingSummary";
import { PublicListingMainLayout } from "@/components/listings/detail/PublicListingMainLayout";
import { StickyPropertyNav } from "@/components/listings/detail/StickyPropertyNav";
import { ShortTermInquiryCard } from "@/components/listings/detail/ShortTermInquiryCard";
import { AvailabilityCalendarSection } from "@/components/listings/detail/AvailabilityCalendarSection";
import { ListingLegalSection } from "@/components/listings/detail/ListingLegalSection";
import { ListingExternalLinksSection } from "@/components/listings/detail/ListingExternalLinksSection";
import { ListingCoreContent } from "@/components/listings/detail/ListingCoreContent";
import { ListingArrivalSection } from "@/components/listings/detail/ListingArrivalSection";
import { ListingHeaderIconActions } from "@/components/listings/detail/ListingHeaderActions";
import { ListingInquiryDatesProvider } from "@/components/listings/detail/ListingInquiryDatesContext";
import { hasArrivalInfo } from "@/lib/listing-arrival";
import type { ListingPublicDetail, ListingWithImages, ListingCohostWithProfile, ListingContactNumber } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import type { ListingPublicContact } from "@/lib/listing-contact";
import { buildProfileLinkContextFromSearchParams } from "@/lib/profile-link-context";

type Props = {
  listing: ListingPublicDetail;
  nearby: ListingWithImages[];
  unavailablePeriods: ListingUnavailablePeriod[];
  isFavorited: boolean;
  mapPrice: number;
  contact: ListingPublicContact;
  previewMode?: boolean;
  publicCohosts?: ListingCohostWithProfile[];
  publicContactPhones?: ListingContactNumber[];
};

function ListingPageContentInner({
  listing,
  nearby,
  unavailablePeriods,
  isFavorited,
  contact,
  publicCohosts = [],
  publicContactPhones = [],
}: Props) {
  const { mode, showBoth } = useListingRentalMode();
  const searchParams = useSearchParams();
  const profileLinkContext = useMemo(
    () =>
      buildProfileLinkContextFromSearchParams(
        searchParams,
        mode === "monthly" ? "monthly" : "short_term"
      ),
    [mode, searchParams]
  );

  const stickyNavItems = useMemo(() => {
    const items = [
      { id: "about", label: "Περιγραφή" },
      { id: "amenities", label: "Παροχές" },
    ];
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
    <div id="gallery" className="mt-4 overflow-hidden rounded-[20px] lg:mt-5">
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

  const titleBlock = (
    <PublicListingTitleRow
      listing={listing}
      isFavorited={isFavorited}
      onShare={handleShare}
    />
  );

  if (mode === "monthly") {
    return (
      <>
        {titleBlock}
        {gallery}
        <PublicListingSummary
          listing={listing}
          rentalLabel="Μηνιαία / Μεσοπρόθεσμη"
          modeSwitcher={showBoth ? <ListingRentalModeSwitcher /> : undefined}
        />
        <MonthlyListingLayout
          listing={listing}
          unavailablePeriods={unavailablePeriods}
          isFavorited={isFavorited}
          mapPrice={0}
          contact={contact}
          hostName={listing.profiles?.full_name}
          cohosts={publicCohosts}
          publicContactPhones={publicContactPhones}
        />
        <NearbyListingsCarouselSlot
          currentListingId={listing.id}
          listings={nearby}
          rentalMode="monthly"
        />
      </>
    );
  }

  return (
    <>
      {titleBlock}
      {gallery}
      <PublicListingSummary
        listing={listing}
        rentalLabel="Βραχυχρόνια"
        modeSwitcher={showBoth ? <ListingRentalModeSwitcher /> : undefined}
      />

      <PublicListingMainLayout
        content={
          <>
            <StickyPropertyNav items={stickyNavItems} />
            <ListingCoreContent listing={listing} rentalMode="short_term" />
            <ListingArrivalSection listing={listing} />
            <AvailabilityCalendarSection listing={listing} periods={unavailablePeriods} />
            <ListingAreaSection listing={listing} />
            <ListingSleepingSection
              arrangements={listing.sleeping_arrangements}
              images={listing.listing_images ?? []}
            />
            <ListingAdvertiserSection
              listing={listing}
              rentalMode="short_term"
              cohosts={publicCohosts}
              publicContactPhones={publicContactPhones}
              profileLinkContext={profileLinkContext}
            />
            <ListingExternalLinksSection links={listing.external_links ?? []} />
            <ListingLegalSection listing={listing} />
          </>
        }
        sidebar={
          <Suspense fallback={null}>
            <ShortTermInquiryCard
              listing={listing}
              periods={unavailablePeriods}
              contact={contact}
            />
          </Suspense>
        }
      />

      <div className="mt-2 border-t border-border pt-2">
        <NearbyListingsCarouselSlot
          currentListingId={listing.id}
          listings={nearby}
          rentalMode="short_term"
        />
      </div>
    </>
  );
}

export function ListingPageContent(props: Props) {
  return (
    <ListingInquiryDatesProvider listing={props.listing} periods={props.unavailablePeriods}>
      <ListingPageContentInner {...props} />
    </ListingInquiryDatesProvider>
  );
}
