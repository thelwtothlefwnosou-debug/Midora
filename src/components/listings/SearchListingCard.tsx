"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ListingWithImages } from "@/lib/types";
import {
  formatBedroomsLabel,
  formatBathroomsLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import {
  formatMinStayLabel,
  listingRentalType,
} from "@/lib/rental-types";
import { resolveListingSearchPrice } from "@/lib/listing-search-links";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { getListingCardAvailabilityLabel } from "@/lib/listing-card-availability";
import { ListingCardAvailabilityOverlay } from "@/components/listings/ListingCardAvailabilityOverlay";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/FavoriteButton";

function SearchListingCover({ listing, alt }: { listing: ListingWithImages; alt: string }) {
  const coverUrl = pickListingCoverPhotoUrl(listing);

  if (!coverUrl) {
    return <div className="h-full w-full bg-gradient-to-br from-sand/90 to-sand/50" />;
  }

  return (
    <Image
      src={coverUrl}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, 50vw"
      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
    />
  );
}

function SearchCardFacts({ listing }: { listing: ListingWithImages }) {
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const parts = [
    formatBedroomsLabel(listing.bedrooms),
    formatBathroomsLabel(bathrooms),
    listing.sqm ? `${listing.sqm} τ.μ.` : null,
    listing.max_guests != null ? `${listing.max_guests} άτομα` : null,
  ].filter(Boolean);

  return (
    <p className="mt-1 line-clamp-1 text-[13px] text-muted">{parts.join(" · ")}</p>
  );
}

function SearchCardPrice({
  listing,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
}: {
  listing: ListingWithImages;
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
}) {
  const resolved = resolveListingSearchPrice(listing, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter,
  });
  const minStay = formatMinStayLabel(listing);
  const rt = listingRentalType(listing);

  return (
    <div className="mt-2">
      <p className="text-[15px] font-semibold text-charcoal">{resolved.display}</p>
      {resolved.isStayTotal && resolved.breakdown ? (
        <p className="mt-0.5 text-xs text-muted">{resolved.breakdown}</p>
      ) : null}
      {minStay && (
        <p className="mt-0.5 text-xs text-muted">
          {rt === "short_term" ? "Ελάχιστη διαμονή" : "Ελάχιστη διάρκεια"}: {minStay}
        </p>
      )}
    </div>
  );
}

type CardProps = {
  listing: ListingWithImages;
  active?: boolean;
  onHover?: () => void;
  onHoverEnd?: () => void;
  favorited?: boolean;
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
  listingHref?: string;
  unavailablePeriods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
};

export const SearchListingCardGrid = memo(function SearchListingCardGrid({
  listing,
  active,
  onHover,
  onHoverEnd,
  favorited = false,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
  listingHref,
  unavailablePeriods = [],
}: CardProps) {
  const href = listingHref ?? `/listings/${listing.id}`;
  const availabilityLabel = getListingCardAvailabilityLabel(listing, unavailablePeriods);

  return (
    <article
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={cn(
        "group h-full rounded-xl transition-shadow",
        active && "ring-2 ring-[#222222] ring-offset-2"
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-sand/40">
          <SearchListingCover listing={listing} alt={listing.title} />
          <ListingCardAvailabilityOverlay label={availabilityLabel} />
          <div
            className="absolute top-2.5 right-2.5 z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <FavoriteButton listingId={listing.id} initialFavorited={favorited} size="sm" />
          </div>
        </div>

        <div className="mt-2.5 px-0.5">
          <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-charcoal">
            {listing.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold/80" aria-hidden />
            <span className="line-clamp-1">
              {listing.area}, {listing.city}
            </span>
          </p>
          <SearchCardFacts listing={listing} />
          <SearchCardPrice
            listing={listing}
            interestFrom={interestFrom}
            interestTo={interestTo}
            durationMonths={durationMonths}
            rentalTypeFilter={rentalTypeFilter}
          />
        </div>
      </Link>
    </article>
  );
});

export function SearchListingCardCompact({
  listing,
  favorited = false,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
  listingHref,
  active,
  onHover,
  onHoverEnd,
  unavailablePeriods = [],
}: CardProps) {
  const href = listingHref ?? `/listings/${listing.id}`;
  const availabilityLabel = getListingCardAvailabilityLabel(listing, unavailablePeriods);

  return (
    <article
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={cn("group", active && "rounded-xl ring-2 ring-[#222222] ring-offset-2")}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-sand/40">
          <SearchListingCover listing={listing} alt={listing.title} />
          <ListingCardAvailabilityOverlay label={availabilityLabel} />
          <div
            className="absolute top-2.5 right-2.5 z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <FavoriteButton listingId={listing.id} initialFavorited={favorited} size="sm" />
          </div>
        </div>
        <div className="mt-2 px-0.5">
          <h3 className="line-clamp-2 text-sm font-semibold text-charcoal">{listing.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">
            {listing.area}, {listing.city}
          </p>
          <SearchCardFacts listing={listing} />
          <SearchCardPrice
            listing={listing}
            interestFrom={interestFrom}
            interestTo={interestTo}
            durationMonths={durationMonths}
            rentalTypeFilter={rentalTypeFilter}
          />
        </div>
      </Link>
    </article>
  );
}

/** @deprecated Horizontal row variant — not used on results page */
export function SearchListingCard(props: CardProps) {
  return <SearchListingCardGrid {...props} />;
}
