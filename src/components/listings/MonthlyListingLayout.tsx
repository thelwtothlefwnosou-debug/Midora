"use client";

import { StickyPropertyNav } from "@/components/listings/detail/StickyPropertyNav";
import { MonthlyInquiryCard } from "@/components/listings/detail/MonthlyInquiryCard";
import { ListingLegalSection } from "@/components/listings/detail/ListingLegalSection";
import { ListingCoreContent } from "@/components/listings/detail/ListingCoreContent";
import { ListingAreaSection } from "@/components/listings/short-term/ListingAreaSection";
import { ListingAdvertiserSection } from "@/components/listings/short-term/ListingAdvertiserSection";
import { SimilarListingsSection } from "@/components/listings/short-term/SimilarListingsSection";
import { ListingPropertyDetails } from "@/components/listings/ListingPropertyDetails";
import { ListingTermsSection } from "@/components/listings/ListingTermsSection";
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

export function MonthlyListingLayout({
  listing,
  contact,
  hostName,
  similar = [],
}: Props) {
  return (
    <>
      <ListingCoreContent listing={listing} rentalMode="monthly" />

      <StickyPropertyNav
        items={[
          { id: "about", label: "Περιγραφή" },
          { id: "amenities", label: "Παροχές" },
          { id: "area", label: "Περιοχή" },
        ]}
      />

      <div className="mt-6 grid gap-12 lg:grid-cols-3 lg:gap-10">
        <div className="min-w-0 space-y-0 lg:col-span-2">
          <ListingAreaSection listing={listing} />
          <ListingAdvertiserSection listing={listing} />
          {similar.length > 0 && <SimilarListingsSection listings={similar} />}
          <section className="listing-section scroll-mt-32">
            <ListingPropertyDetails listing={listing} />
            <ListingTermsSection listing={listing} />
          </section>
          <ListingLegalSection listing={listing} />
        </div>

        <MonthlyInquiryCard listing={listing} contact={contact} hostName={hostName} />
      </div>
    </>
  );
}
