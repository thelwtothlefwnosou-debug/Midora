"use client";

import { useSearchParams } from "next/navigation";
import type { ListingWithImages } from "@/lib/types";
import { NearbyListingsCarousel } from "@/components/listings/detail/NearbyListingsCarousel";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import { parseSearchDurationMonths } from "@/lib/listing-search-links";

type Props = {
  currentListingId: string;
  listings: ListingWithImages[];
  rentalMode: "short_term" | "monthly";
};

/** Uses inquiry dates when inside ListingInquiryDatesProvider; falls back to URL params. */
export function NearbyListingsCarouselSlot({
  currentListingId,
  listings,
  rentalMode,
}: Props) {
  const searchParams = useSearchParams();
  const inquiryDates = useListingInquiryDates();

  const interestFrom =
    inquiryDates.range?.start ??
    searchParams.get("interestFrom")?.trim() ??
    searchParams.get("start")?.trim() ??
    undefined;
  const interestTo =
    inquiryDates.range?.end ??
    searchParams.get("interestTo")?.trim() ??
    searchParams.get("end")?.trim() ??
    undefined;
  const durationMonths = parseSearchDurationMonths(searchParams.get("durationMonths"));

  return (
    <NearbyListingsCarousel
      currentListingId={currentListingId}
      listings={listings}
      rentalMode={rentalMode}
      interestFrom={interestFrom}
      interestTo={interestTo}
      durationMonths={durationMonths}
    />
  );
}

/** Monthly-only pages without inquiry date context. */
export function NearbyListingsCarouselFromUrl({
  currentListingId,
  listings,
  rentalMode,
}: Props) {
  const searchParams = useSearchParams();

  const interestFrom =
    searchParams.get("interestFrom")?.trim() ||
    searchParams.get("start")?.trim() ||
    undefined;
  const interestTo =
    searchParams.get("interestTo")?.trim() ||
    searchParams.get("end")?.trim() ||
    undefined;
  const durationMonths = parseSearchDurationMonths(searchParams.get("durationMonths"));

  return (
    <NearbyListingsCarousel
      currentListingId={currentListingId}
      listings={listings}
      rentalMode={rentalMode}
      interestFrom={interestFrom}
      interestTo={interestTo}
      durationMonths={durationMonths}
    />
  );
}
