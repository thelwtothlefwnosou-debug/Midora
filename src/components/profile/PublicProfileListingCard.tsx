"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { PublicProfileListingItem } from "@/lib/profile-public-queries";
import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { resolveListingSearchPrice } from "@/lib/listing-search-links";
import { formatListingPrice, listingRentalType } from "@/lib/rental-types";
import { getListingPublicId, cn } from "@/lib/utils";

type Props = {
  listing: PublicProfileListingItem;
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
  className?: string;
};

export function PublicProfileListingCard({
  listing,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
  className,
}: Props) {
  const t = useTranslations("Profile.public");
  const locale = useLocale();
  const cover = pickListingCoverPhotoUrl(listing);
  const rentalMode = listingRentalType(listing);
  const resolved = resolveListingSearchPrice(listing as unknown as ListingWithImages, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter: rentalTypeFilter ?? rentalMode,
  }, locale);

  const priceDisplay =
    resolved.display && resolved.sortAmount > 0 && !resolved.isUnavailable
      ? resolved.display
      : formatListingPrice(listing as unknown as ListingWithImages, locale).display;

  const href = `/listings/${getListingPublicId(listing)}`;
  const location = [
    listing.area_display_name ?? listing.area,
    listing.city_display_name ?? listing.city,
  ]
    .filter(Boolean)
    .join(", ");
  const rentalLabel =
    rentalMode === "short_term" ? t("shortTermBadge") : t("monthlyBadge");
  const roleLabel =
    listing.profileRole === "cohost" ? t("cohostBadge") : t("ownerBadge");

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-[0_6px_24px_-10px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_10px_32px_-12px_rgba(0,0,0,0.16)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] bg-sand/30">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sand/90 to-sand/50" />
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-charcoal shadow-sm">
          {rentalLabel}
        </span>
        {listing.profileRole === "cohost" ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-charcoal/85 px-2 py-0.5 text-[10px] font-medium text-white">
            {roleLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-medium leading-snug text-charcoal">{listing.title}</p>
        {location ? <p className="mt-1 text-sm text-muted">{location}</p> : null}
        <p className="mt-2 text-[15px] font-semibold text-charcoal">{priceDisplay}</p>
      </div>
    </Link>
  );
}
