"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { ListingHeaderActions } from "@/components/listings/detail/ListingHeaderActions";
import type { ListingPublicDetail } from "@/lib/types";
import {
  formatPublicBedroomsLabel,
  formatPublicBathroomsLabel,
  formatPublicBedsLabel,
  formatPublicGuestsLabel,
  formatPublicLocationLabel,
  formatPublicSqmLabel,
  type PublicLabelsT,
} from "@/lib/listing-public-labels";
import { resolveListingBathrooms } from "@/lib/listing-filter-helpers";
import { countBedsFromSleeping } from "@/lib/listing-short-term-price";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  rentalLabel: string;
  isFavorited: boolean;
  onShare: () => void;
  modeSwitcher?: React.ReactNode;
  className?: string;
};

function buildMetadataLine(
  listing: ListingPublicDetail,
  tLabels: PublicLabelsT
): string {
  const beds =
    listing.sleeping_arrangements.length > 0
      ? countBedsFromSleeping(listing.sleeping_arrangements)
      : listing.bedrooms;
  const baths = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const parts: string[] = [];

  if (listing.max_guests != null) {
    parts.push(formatPublicGuestsLabel(listing.max_guests, tLabels));
  }
  parts.push(formatPublicBedroomsLabel(listing.bedrooms, tLabels));
  if (beds > 0) parts.push(formatPublicBedsLabel(beds, tLabels));
  parts.push(formatPublicBathroomsLabel(baths, tLabels));
  if (listing.sqm) parts.push(formatPublicSqmLabel(listing.sqm, tLabels));

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
  const tLabels = useTranslations("Listing.labels");
  const metadata = buildMetadataLine(listing, tLabels);

  return (
    <header className={cn("mt-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full border border-gold/30 bg-[#f7f0e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-gold-dark">
            {rentalLabel}
          </span>
          <h1 className="listing-page-title mt-3">{listing.title}</h1>
          <p className="listing-meta mt-2 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold/80" aria-hidden />
            {formatPublicLocationLabel(listing, tLabels)}
          </p>
          {metadata && (
            <p className="mt-2 text-sm text-charcoal/60">{metadata}</p>
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
