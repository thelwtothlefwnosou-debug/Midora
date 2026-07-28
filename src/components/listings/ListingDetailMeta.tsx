"use client";

import { Bed, Bath, Maximize, Car, PawPrint, Sparkles, Zap, Building2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import {
  formatFloorLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import { formatListingAvailabilityText } from "@/lib/listing-availability-status";
import {
  formatPublicBedroomsLabel,
  formatPublicBathroomsLabel,
  formatPublicSqmLabel,
} from "@/lib/listing-public-labels";
import { getListingBadges } from "@/lib/listing-badges";
import { badgeClassName } from "@/lib/listing-badges";
import { LegalRegistryBlock } from "@/components/listings/LegalRegistryBlock";
import { ListingRentalModeSwitcher } from "@/components/listings/ListingRentalModeSwitcher";
import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import {
  formatPublicMinStayForMode,
  publicMinStayHeading,
  publicModeBadgeLabels,
  publicPricePrimary,
  publicPriceSecondaryHint,
} from "@/lib/listing-rental-modes";
import { cn } from "@/lib/utils";

export function ListingDetailMeta({ listing }: { listing: ListingWithImages }) {
  const tCommon = useTranslations("Common");
  const tListing = useTranslations("Listing");
  const tLabels = useTranslations("Listing.labels");
  const locale = useLocale();
  const { mode, showBoth, showMonthly } = useListingRentalMode();
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const floorLabel = formatFloorLabel(listing.floor);
  const price = publicPricePrimary(listing, mode, undefined, {
    perNight: tCommon("perNight"),
    perMonth: tCommon("perMonth"),
  }, locale);
  const secondaryHint = publicPriceSecondaryHint(listing, mode);
  const rentalBadges = publicModeBadgeLabels(listing, mode);
  const badges = getListingBadges(listing).filter(
    (b) => b.kind !== "rental_type" && b.kind !== "rental_type_secondary" && b.kind !== "ama"
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            mode === "short_term"
              ? "bg-charcoal text-white"
              : "bg-gold text-white"
          )}
        >
          {rentalBadges.primary}
        </span>
        {rentalBadges.secondary && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-charcoal ring-1 ring-border">
            {rentalBadges.secondary}
          </span>
        )}
        {badges.map((badge) => (
          <span
            key={badge.kind}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              badgeClassName(badge.kind)
            )}
          >
            {badge.label}
          </span>
        ))}
      </div>

      {showBoth && <ListingRentalModeSwitcher />}

      <div className="space-y-1">
        <p
          className={cn(
            "listing-price-display text-2xl sm:text-3xl",
            mode === "short_term" ? "text-charcoal" : "text-gold"
          )}
        >
          {price.display}
        </p>
        {secondaryHint && (
          <p className="text-sm text-muted">{secondaryHint}</p>
        )}
        {mode === "monthly" && (
          <p className="text-sm text-muted">{tCommon("finalPriceOwner")}</p>
        )}
      </div>

      {mode === "short_term" && <LegalRegistryBlock listing={listing} />}

      <p className="text-sm text-muted">
        {publicMinStayHeading(mode)}: {formatPublicMinStayForMode(listing, mode)}
      </p>

      {showMonthly && mode === "monthly" && (
        <p className="text-sm text-muted">
          {tListing("availability")}:{" "}
          {formatListingAvailabilityText(listing, (key, values) =>
            tListing(key, values)
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-charcoal/70">
        <span className="flex items-center gap-1">
          <Bed className="h-4 w-4" /> {formatPublicBedroomsLabel(listing.bedrooms, tLabels)}
        </span>
        <span className="flex items-center gap-1">
          <Bath className="h-4 w-4" /> {formatPublicBathroomsLabel(bathrooms, tLabels)}
        </span>
        {floorLabel && (
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" /> {floorLabel}
          </span>
        )}
        {listing.sqm && (
          <span className="flex items-center gap-1">
            <Maximize className="h-4 w-4" /> {formatPublicSqmLabel(listing.sqm, tLabels)}
          </span>
        )}
        {mode === "short_term" && (
          <span>{listing.furnished ? tListing("furnished") : tListing("unfurnished")}</span>
        )}
        {listing.has_parking && (
          <span className="flex items-center gap-1 text-gold">
            <Car className="h-4 w-4" /> {tListing("parking")}
          </span>
        )}
        {listing.pets_allowed && (
          <span className="flex items-center gap-1 text-teal">
            <PawPrint className="h-4 w-4" /> {tListing("petsAllowed")}
          </span>
        )}
        {mode === "short_term" && listing.cleaning_included && (
          <span className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> {tCommon("cleaningIncluded")}
          </span>
        )}
        {mode === "short_term" && listing.utilities_included && (
          <span className="flex items-center gap-1 text-teal">
            <Zap className="h-4 w-4" /> {tCommon("allIncluded")}
          </span>
        )}
      </div>
    </div>
  );
}
