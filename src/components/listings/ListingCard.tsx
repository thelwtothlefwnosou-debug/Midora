"use client";

import Link from "next/link";
import Image from "next/image";
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
import { formatListingPrice, cardRegistryLabel, listingCardDetailLines } from "@/lib/rental-types";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { ListingImageCarousel } from "@/components/listings/ListingImageCarousel";
import { ListingCardBadges } from "@/components/listings/ListingCardBadges";
import { ListingCardAvailabilityOverlay } from "@/components/listings/ListingCardAvailabilityOverlay";
import { getListingCardAvailabilityLabel } from "@/lib/listing-card-availability";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

function HomeListingCover({ listing, alt }: { listing: ListingWithImages; alt: string }) {
  const coverUrl = pickListingCoverPhotoUrl(listing);

  if (!coverUrl) {
    return <div className="h-full w-full bg-gradient-to-br from-sand/90 to-sand/60" />;
  }

  return (
    <Image
      src={coverUrl}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover transition-transform duration-500 group-hover/card:scale-[1.02]"
    />
  );
}

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
  const price = formatListingPrice(listing);
  const registry = cardRegistryLabel(listing);
  const detailLines = listingCardDetailLines(listing);
  const floorLabel = formatFloorLabel(listing.floor);
  const availabilityLabel = getListingCardAvailabilityLabel(listing, unavailablePeriods);

  return (
    <Link href={href} className="block h-full">
      <article
        className={cn(
          "group/card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all duration-300",
          isHome
            ? "hover:-translate-y-0.5 hover:border-gold/25 hover:shadow-card"
            : "group-hover:border-gold/25 group-hover:shadow-card"
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-sand/40">
          {isHome ? (
            <HomeListingCover listing={listing} alt={listing.title} />
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
              <Bed className="h-3.5 w-3.5 text-gold/80" /> {formatBedroomsLabel(listing.bedrooms)}
            </span>
            <span className="text-border/80">·</span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-gold/80" /> {formatBathroomsLabel(bathrooms)}
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
                  <Maximize className="h-3.5 w-3.5 text-gold/80" /> {listing.sqm} τ.μ.
                </span>
              </>
            )}
          </div>

          <div className="mt-auto pt-4">
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
            <p className="mt-1.5 text-xs font-medium text-gold">{COPY.viewListing}</p>
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

  const href = `/listings/${listing.id}`;
  const images = listing.listing_images ?? [];
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const isHome = variant === "home";

  const displayBadges =
    badges ??
    (badge
      ? [{ kind: "new" as const, label: badge, priority: 1 }]
      : getListingBadges(listing));

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
