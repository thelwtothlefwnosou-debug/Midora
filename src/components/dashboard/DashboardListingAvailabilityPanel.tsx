"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListingAvailabilityEditor } from "@/components/dashboard/ListingAvailabilityEditor";
import { ShortTermAvailabilitySection } from "@/components/dashboard/ShortTermAvailabilitySection";
import {
  formatPublicMinStayMonths,
  formatPublicMinStayNights,
  publicPricePrimary,
  resolveSupportsBothModes,
  resolveSupportsMonthly,
  resolveSupportsShortTerm,
} from "@/lib/listing-rental-modes";
import type { ListingWithImages } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn } from "@/lib/utils";

type Tab = "short_term" | "monthly";

type Props = {
  listing: ListingWithImages;
  periods: ListingUnavailablePeriod[];
  className?: string;
};

export function DashboardListingAvailabilityPanel({ listing, periods, className }: Props) {
  const t = useTranslations("Workspace.availabilityPanel");
  const supportsShort = resolveSupportsShortTerm(listing);
  const supportsMonthly = resolveSupportsMonthly(listing);
  const bothModes = resolveSupportsBothModes(listing);

  const defaultTab: Tab = supportsShort ? "short_term" : "monthly";
  const [tab, setTab] = useState<Tab>(defaultTab);

  if (!supportsShort && !supportsMonthly) {
    return null;
  }

  if (!bothModes) {
    if (supportsShort) {
      return (
        <ShortTermAvailabilitySection
          listingId={listing.id}
          periods={periods}
          className={className}
        />
      );
    }
    return (
      <ListingAvailabilityEditor
        listingId={listing.id}
        availabilityStatus={listing.availability_status}
        availabilityNote={listing.availability_note}
        compact
        variant="monthly"
        className={className}
      />
    );
  }

  const shortPrice = publicPricePrimary(listing, "short_term");
  const monthlyPrice = publicPricePrimary(listing, "monthly");

  return (
    <div className={cn("rounded-xl border border-border bg-sand/40 p-3", className)}>
      <div className="flex gap-1 rounded-lg bg-white/80 p-1">
        <button
          type="button"
          onClick={() => setTab("short_term")}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            tab === "short_term"
              ? "bg-gold text-white"
              : "text-charcoal/70 hover:bg-sand/60"
          )}
        >
          {t("tabShortTerm")}
        </button>
        <button
          type="button"
          onClick={() => setTab("monthly")}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            tab === "monthly"
              ? "bg-gold text-white"
              : "text-charcoal/70 hover:bg-sand/60"
          )}
        >
          {t("tabMonthly")}
        </button>
      </div>

      {tab === "short_term" ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
            <span>{shortPrice.display}</span>
            <span>{t("minStayNights", { value: formatPublicMinStayNights(listing) })}</span>
          </div>
          <ShortTermAvailabilitySection
            listingId={listing.id}
            periods={periods}
            embedded
            className="border-0 bg-transparent p-0"
          />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
            <span>{monthlyPrice.display}</span>
            <span>{t("minDurationMonths", { value: formatPublicMinStayMonths(listing) })}</span>
          </div>
          <ListingAvailabilityEditor
            listingId={listing.id}
            availabilityStatus={listing.availability_status}
            availabilityNote={listing.availability_note}
            compact
            variant="monthly"
            className="border-0 bg-transparent p-0"
          />
        </div>
      )}
    </div>
  );
}
