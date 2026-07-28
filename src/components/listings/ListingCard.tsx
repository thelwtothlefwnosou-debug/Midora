"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Bed, Bath, Maximize, MapPin, Users, Building2 } from "lucide-react";
import type { ListingWithImages } from "@/lib/types";
import {
  formatBedroomsLabel,
  formatBathroomsLabel,
  formatFloorLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import { getListingBadges, type ListingBadge } from "@/lib/listing-badges";
import {
  getFormattedListingPrice,
  getCardRegistryLabel,
  getListingCardDetailLines,
} from "@/lib/rental-types";
import { resolveListingSearchPrice } from "@/lib/listing-search-links";
import {
  formatPublicStayPriceNightsLine,
  formatPublicStayPriceTotal,
} from "@/lib/listing-short-term-price";
import { useTranslations, useLocale } from "next-intl";
import { cn, getListingPublicId } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { ListingImageCarousel } from "@/components/listings/ListingImageCarousel";
import { ListingCardImageCarousel } from "@/components/listings/ListingCardImageCarousel";
import { ListingCardBadges } from "@/components/listings/ListingCardBadges";
import { ListingCardAvailabilityOverlay } from "@/components/listings/ListingCardAvailabilityOverlay";
import { getListingCardAvailabilityLabel } from "@/lib/listing-card-availability";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

function ListingCardContent({
  listing,
  href,
  images,
  bathrooms,
  displayBadges,
  favorited,
  isHome,
  unavailablePeriods = [],
}: {
  listing: ListingWithImages;
  href: string;
  images: ListingWithImages["listing_images"];
  bathrooms: number;
  displayBadges: ListingBadge[];
  favorited: boolean;
  isHome: boolean;
  unavailablePeriods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
}) {
  const tCommon = useTranslations("Common");
  const tListing = useTranslations("Listing");
  const tLabels = useTranslations("Listing.labels");
  const locale = useLocale();
  const price = getFormattedListingPrice(listing, tCommon);
  const searchPrice = isHome
    ? resolveListingSearchPrice(listing, { unavailablePeriods }, locale)
    : null;
  const registry = getCardRegistryLabel(listing, tListing);
  const detailLines = isHome ? [] : getListingCardDetailLines(listing, tListing);
  const floorLabel = formatFloorLabel(listing.floor, locale);
  const availabilityLabel = getListingCardAvailabilityLabel(
    listing,
    unavailablePeriods,
    locale
  );

  return (
    <Link href={href} className="block h-full">
      <article
        className={cn(
          "group/card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all duration-300",
          isHome
            ? "hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(26,26,26,0.22)] border-transparent shadow-[0_8px_28px_-14px_rgba(26,26,26,0.14)]"
            : "group-hover:border-gold/25 group-hover:shadow-card"
        )}
      >
        <div className={cn(
          "relative overflow-hidden bg-sand/40",
          isHome ? "aspect-[3/2]" : "aspect-[4/3]"
        )}>
          {isHome ? (
            <ListingCardImageCarousel
              images={images ?? []}
              alt={listing.title}
            />
          ) : (
            <ListingImageCarousel
              images={images ?? []}
              alt={listing.title}
              imageClassName="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-[1.03]"
            />
          )}
          <ListingCardBadges
            badges={displayBadges}
            variant={isHome ? "home" : "default"}
            className={cn("top-3 left-3 gap-1.5", isHome && "top-2.5 left-2.5")}
          />
          <ListingCardAvailabilityOverlay label={availabilityLabel} />
          <div
            className="absolute top-3 right-3 z-40"
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton
              listingId={listing.id}
              initialFavorited={favorited}
              size="sm"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-[1.125rem]">
          <h3 className="font-display text-base font-semibold text-charcoal line-clamp-1 sm:text-lg">
            {listing.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold/70" />
            <span className="line-clamp-1">
              {listing.area}, {listing.city}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted sm:text-sm">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-gold/80" /> {formatBedroomsLabel(listing.bedrooms, locale)}
            </span>
            <span className="text-border/80">·</span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-gold/80" /> {formatBathroomsLabel(bathrooms, locale)}
            </span>
            {floorLabel && (
              <>
                <span className="text-border/80">·</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-gold/80" /> {floorLabel}
                </span>
              </>
            )}
            {listing.max_guests != null && (
              <>
                <span className="text-border/80">·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-gold/80" /> {listing.max_guests}
                </span>
              </>
            )}
            {listing.sqm && (
              <>
                <span className="text-border/80">·</span>
                <span className="flex items-center gap-1">
                  <Maximize className="h-3.5 w-3.5 text-gold/80" />{" "}
                  {tLabels("sqm", { sqm: listing.sqm })}
                </span>
              </>
            )}
          </div>

          <div className="mt-auto pt-4">
            {isHome && searchPrice ? (
              <>
                {searchPrice.isStayTotal &&
                searchPrice.total != null &&
                searchPrice.nights != null ? (
                  <>
                    <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
                      {formatPublicStayPriceTotal(searchPrice.total, locale)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatPublicStayPriceNightsLine(searchPrice.nights, locale)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
                      {searchPrice.display}
                    </p>
                    {searchPrice.helper ? (
                      <p className="mt-0.5 text-[11px] text-muted">{searchPrice.helper}</p>
                    ) : null}
                  </>
                )}
              </>
            ) : (
              <>
                <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
                  {price.display}
                </p>
                {detailLines.map((line) => (
                  <p key={line} className="mt-0.5 text-[11px] text-muted">
                    {line}
                  </p>
                ))}
                {registry && (
                  <p className="mt-0.5 text-[11px] font-medium text-teal">{registry}</p>
                )}
              </>
            )}
            <p className="mt-1.5 text-xs font-medium text-gold">{tCommon("viewListing")}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ListingCard({
  listing,
  index = 0,
  favorited = false,
  badges,
  badge,
  variant = "default",
  unavailablePeriods = [],
}: {
  listing: ListingWithImages;
  index?: number;
  favorited?: boolean;
  badges?: ListingBadge[];
  badge?: string;
  variant?: "default" | "home";
  unavailablePeriods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
}) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), {
    stiffness: 260,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), {
    stiffness: 260,
    damping: 28,
  });

  const href = `/listings/${getListingPublicId(listing)}`;
  const images = listing.listing_images ?? [];
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const isHome = variant === "home";

  const displayBadges =
    badges ??
    (badge
      ? [{ kind: "new" as const, label: badge, priority: 1 }]
      : getListingBadges(listing, locale));

  const content = (
    <ListingCardContent
      listing={listing}
      href={href}
      images={images}
      bathrooms={bathrooms}
      displayBadges={displayBadges}
      favorited={favorited}
      isHome={isHome}
      unavailablePeriods={unavailablePeriods}
    />
  );

  if (isHome) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      onMouseMove={(e) => {
        if (!ref.current || window.matchMedia("(max-width: 1023px)").matches) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="group card-3d h-full"
    >
      {content}
    </motion.div>
  );
}
