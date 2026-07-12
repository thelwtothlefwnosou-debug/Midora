"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StickyPropertyNav } from "@/components/listings/detail/StickyPropertyNav";
import { MonthlyInquiryCard } from "@/components/listings/detail/MonthlyInquiryCard";
import { PublicListingMainLayout } from "@/components/listings/detail/PublicListingMainLayout";
import { ListingLegalSection } from "@/components/listings/detail/ListingLegalSection";
import { ListingExternalLinksSection } from "@/components/listings/detail/ListingExternalLinksSection";
import { ListingCoreContent } from "@/components/listings/detail/ListingCoreContent";
import { ListingAreaSection } from "@/components/listings/short-term/ListingAreaSection";
import { ListingAdvertiserSection } from "@/components/listings/short-term/ListingAdvertiserSection";
import { ListingPropertyDetails } from "@/components/listings/ListingPropertyDetails";
import { ListingTermsSection } from "@/components/listings/ListingTermsSection";
import type { ListingPublicDetail } from "@/lib/types";
import type { ListingCohostWithProfile, ListingContactNumber } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import type { ListingPublicContact } from "@/lib/listing-contact";
import { buildProfileLinkContextFromSearchParams } from "@/lib/profile-link-context";

type Props = {
  listing: ListingPublicDetail;
  unavailablePeriods: ListingUnavailablePeriod[];
  isFavorited: boolean;
  mapPrice: number;
  contact: ListingPublicContact;
  hostName?: string | null;
  cohosts?: ListingCohostWithProfile[];
  publicContactPhones?: ListingContactNumber[];
};

export function MonthlyListingLayout({
  listing,
  contact,
  hostName,
  cohosts = [],
  publicContactPhones = [],
}: Props) {
  const searchParams = useSearchParams();
  const profileLinkContext = useMemo(
    () => buildProfileLinkContextFromSearchParams(searchParams, "monthly"),
    [searchParams]
  );

  return (
    <PublicListingMainLayout
      content={
        <>
          <StickyPropertyNav
            items={[
              { id: "about", label: "Περιγραφή" },
              { id: "amenities", label: "Παροχές" },
              { id: "area", label: "Περιοχή" },
            ]}
          />
          <ListingCoreContent listing={listing} rentalMode="monthly" />
          <ListingAreaSection listing={listing} />
          <section className="listing-section scroll-mt-32">
            <ListingPropertyDetails listing={listing} />
            <ListingTermsSection listing={listing} />
          </section>
          <ListingAdvertiserSection
            listing={listing}
            rentalMode="monthly"
            profileLinkContext={profileLinkContext}
            cohosts={cohosts}
            publicContactPhones={publicContactPhones}
          />
          <ListingExternalLinksSection links={listing.external_links ?? []} />
          <ListingLegalSection listing={listing} />
        </>
      }
      sidebar={
        <MonthlyInquiryCard listing={listing} contact={contact} hostName={hostName} />
      }
    />
  );
}
