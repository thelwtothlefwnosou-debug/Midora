"use client";

import { memo } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import {
  formatBedroomsLabel,
  formatBathroomsLabel,
  formatFloorLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import {
  getMinStayLabel,
  listingRentalType,
} from "@/lib/rental-types";
import { resolveListingSearchPrice } from "@/lib/listing-search-links";
import { getListingCardAvailabilityLabel } from "@/lib/listing-card-availability";
import { ListingCardAvailabilityOverlay } from "@/components/listings/ListingCardAvailabilityOverlay";
import { ListingCardImageCarousel } from "@/components/listings/ListingCardImageCarousel";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn, getListingPublicId } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/FavoriteButton";

function SearchCardFacts({ listing }: { listing: ListingWithImages }) {
  const locale = useLocale();
  const tLabels = useTranslations("Listing.labels");
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const parts = [
    formatBedroomsLabel(listing.bedrooms, locale),
    formatBathroomsLabel(bathrooms, locale),
    formatFloorLabel(listing.floor, locale),
    listing.sqm ? tLabels("sqm", { sqm: listing.sqm }) : null,
    listing.max_guests != null ? tLabels("guestsCount", { count: listing.max_guests }) : null,
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
  guests,
  unavailablePeriods = [],
}: {
  listing: ListingWithImages;
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
  guests?: number;
  unavailablePeriods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
}) {
  const locale = useLocale();
  const t = useTranslations("Listing");
  const resolved = resolveListingSearchPrice(listing, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter,
    guests,
    unavailablePeriods,
  }, locale);
  const minStay = getMinStayLabel(listing, t);
  const displayMode =
    rentalTypeFilter === "short_term" || rentalTypeFilter === "monthly"
      ? rentalTypeFilter
      : listingRentalType(listing);

  if (resolved.isUnavailable) {
    return (
      <div className="mt-2">
        <p className="text-[15px] font-semibold text-charcoal/70">{resolved.display}</p>
        {resolved.helper ? (
          <p className="mt-0.5 text-xs text-muted">{resolved.helper}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-[15px] font-semibold text-charcoal">{resolved.display}</p>
      {resolved.helper ? (
        <p className="mt-0.5 text-xs text-muted">{resolved.helper}</p>
      ) : null}
      {minStay && (
        <p className="mt-0.5 text-xs text-muted">
          {displayMode === "short_term"
            ? t("minStayPrefix", { value: minStay })
            : t("minDurationPrefix", { value: minStay })}
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
  guests?: number;
  listingHref?: string;
  unavailablePeriods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
};

function SearchCardMedia({
  listing,
  favorited,
}: {
  listing: ListingWithImages;
  favorited: boolean;
}) {
  const locale = useLocale();
  const availabilityLabel = getListingCardAvailabilityLabel(listing, [], locale);

  const photoCount = (listing.listing_images ?? []).filter(
    (img) => img.media_type !== "video" && Boolean(img.url?.trim())
  ).length;

  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-xl bg-sand/40"
      data-search-card-photos={photoCount}
    >
      <ListingCardImageCarousel
        images={listing.listing_images}
        alt={listing.title}
        variant="light"
        className="absolute inset-0"
        sizes="(max-width: 640px) 100vw, 50vw"
      />
      <ListingCardAvailabilityOverlay label={availabilityLabel} />
      <div
        className="absolute top-2.5 right-2.5 z-40"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <FavoriteButton listingId={listing.id} initialFavorited={favorited} size="sm" />
      </div>
    </div>
  );
}

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
  guests,
  listingHref,
  unavailablePeriods = [],
}: CardProps) {
  const href = listingHref ?? `/listings/${getListingPublicId(listing)}`;

  return (
    <article
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={cn(
        "group/card h-full rounded-xl border border-transparent transition-[box-shadow,background-color,border-color] duration-150",
        active &&
          "border-charcoal/20 bg-charcoal/[0.02] shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
      )}
    >
      <Link href={href} className="block">
        <SearchCardMedia listing={listing} favorited={favorited} />

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
            guests={guests}
            unavailablePeriods={unavailablePeriods}
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
  guests,
  listingHref,
  active,
  onHover,
  onHoverEnd,
  unavailablePeriods = [],
}: CardProps) {
  const href = listingHref ?? `/listings/${getListingPublicId(listing)}`;

  return (
    <article
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={cn("group/card", active && "rounded-xl ring-2 ring-[#222222] ring-offset-2")}
    >
      <Link href={href} className="block">
        <SearchCardMedia listing={listing} favorited={favorited} />
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
            guests={guests}
            unavailablePeriods={unavailablePeriods}
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
