"use client";

import { MapPin } from "lucide-react";
import { ListingHeaderActions } from "@/components/listings/detail/ListingHeaderActions";
import type { ListingPublicDetail } from "@/lib/types";
import {
  formatPublicBedroomsLabel,
  formatPublicBathroomsLabel,
  formatPublicBedsLabel,
  formatPublicGuestsLabel,
  formatPublicSqmLabel,
} from "@/lib/listing-public-labels";
import { resolveListingBathrooms } from "@/lib/listing-filter-helpers";
import { countBedsFromSleeping } from "@/lib/listing-short-term-price";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  rentalLabel: "Βραχυχρόνια" | "Μηνιαία / Μεσοπρόθεσμη";
  isFavorited: boolean;
  onShare: () => void;
  modeSwitcher?: React.ReactNode;
  className?: string;
};

function buildMetadataLine(listing: ListingPublicDetail): string {
  const beds =
    listing.sleeping_arrangements.length > 0
      ? countBedsFromSleeping(listing.sleeping_arrangements)
      : listing.bedrooms;
  const baths = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const parts: string[] = [];

  if (listing.max_guests != null) {
    parts.push(formatPublicGuestsLabel(listing.max_guests));
  }
  parts.push(formatPublicBedroomsLabel(listing.bedrooms));
  if (beds > 0) parts.push(formatPublicBedsLabel(beds));
  parts.push(formatPublicBathroomsLabel(baths));
  if (listing.sqm) parts.push(formatPublicSqmLabel(listing.sqm));

  return parts.join(" · ");
}

export function ListingIdentityHeader({
  listing,
  rentalLabel,
  isFavorited,
  onShare,
  modeSwitcher,
  className,
}: Props) {
  const metadata = buildMetadataLine(listing);

  return (
    <header className={cn("mt-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full border border-gold/30 bg-[#f7f0e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-gold-dark">
            {rentalLabel}
          </span>
          <h1 className="listing-page-title mt-3">{listing.title}</h1>
          <p className="listing-meta mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            {listing.area}, {listing.city}
          </p>
          {metadata && (
            <p className="mt-2 text-sm text-charcoal/70">{metadata}</p>
          )}
        </div>

        <ListingHeaderActions
          listingId={listing.id}
          listingTitle={listing.title}
          isFavorited={isFavorited}
          onShare={onShare}
          className="sm:pt-1"
        />
      </div>

      {modeSwitcher && <div className="mt-5">{modeSwitcher}</div>}
    </header>
  );
}
