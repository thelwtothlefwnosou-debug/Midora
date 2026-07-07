"use client";

import { PropertyDescriptionSection } from "@/components/listings/detail/PropertyDescriptionSection";
import { PropertyHighlightsSection } from "@/components/listings/detail/PropertyHighlightsSection";
import { AmenitiesSection } from "@/components/listings/detail/AmenitiesSection";
import type { ListingPublicDetail } from "@/lib/types";

type Props = {
  listing: ListingPublicDetail;
  rentalMode?: "short_term" | "monthly";
};

/** Full-width description, highlights and amenities — visible immediately after gallery. */
export function ListingCoreContent({ listing, rentalMode = "short_term" }: Props) {
  return (
    <div className="listing-core-content mt-8 space-y-0">
      <PropertyDescriptionSection
        description={listing.description}
        descriptionEn={listing.description_en}
        lead
      />
      <PropertyHighlightsSection highlights={listing.highlights} />
      <AmenitiesSection listing={listing} rentalMode={rentalMode} />
    </div>
  );
}
