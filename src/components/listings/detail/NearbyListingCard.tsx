"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import {
  buildListingDetailHref,
  resolveListingSearchPrice,
} from "@/lib/listing-search-links";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingWithImages;
  rentalMode: "short_term" | "monthly";
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  searchParams?: URLSearchParams;
  className?: string;
};

export function NearbyListingCard({
  listing,
  rentalMode,
  interestFrom,
  interestTo,
  durationMonths,
  searchParams,
  className,
}: Props) {
  const locale = useLocale();
  const cover = pickListingCoverPhotoUrl(listing);
  if (!cover) return null;

  const resolved = resolveListingSearchPrice(listing, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter: rentalMode,
  }, locale);

  if (resolved.isUnavailable || !resolved.display || resolved.sortAmount <= 0) {
    return null;
  }

  const href = buildListingDetailHref(listing, searchParams);
  const location = [listing.area, listing.city].filter(Boolean).join(", ");

  return (
    <Link
      href={href}
      data-nearby-card
      className={cn(
        "group flex w-[72vw] shrink-0 snap-start flex-col sm:w-[44vw] md:w-[calc((100%-5*1rem)/6)] md:min-w-[148px] md:max-w-[210px]",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[11px] bg-sand/30">
        <Image
          src={cover}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 72vw, 210px"
          className="object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-[0.97]"
        />
      </div>
      <div className="mt-2.5 min-w-0">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-charcoal">
          {listing.title}
        </p>
        {location ? (
          <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">{location}</p>
        ) : null}
        <p className="mt-1 text-[13px] font-semibold text-charcoal">{resolved.display}</p>
      </div>
    </Link>
  );
}
