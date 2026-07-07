"use client";

import Link from "next/link";
import { MapPin, Eye } from "lucide-react";
import type { ListingWithImages } from "@/lib/types";
import { getListingPublicId } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { ListingImageCarousel } from "@/components/listings/ListingImageCarousel";
import { GlassCard } from "@/components/ui/GlassCard";

export function FavoritesListingCard({ listing }: { listing: ListingWithImages }) {
  const href = `/listings/${getListingPublicId(listing)}`;
  const images = listing.listing_images ?? [];

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 sm:w-48">
          <ListingImageCarousel
            images={images}
            alt={listing.title}
            imageClassName="h-full w-full object-cover"
          />
          <div className="absolute top-2.5 right-2.5 z-40">
            <FavoriteButton listingId={listing.id} initialFavorited size="sm" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-charcoal line-clamp-2">
              {listing.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
              {listing.area}, {listing.city}
            </p>
          </div>

          <p className="font-display text-xl font-semibold text-charcoal">
            €{listing.price_monthly.toLocaleString("el-GR")}
            <span className="ml-1 text-sm font-normal text-muted">/ μήνα</span>
          </p>

          <div className="mt-auto">
            <Link
              href={href}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-charcoal transition-colors hover:border-gold/40 hover:text-gold"
            >
              <Eye className="h-4 w-4" />
              Προβολή
            </Link>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
