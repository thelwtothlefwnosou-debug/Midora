"use client";

import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { ListingAvailability } from "@/components/listings/ListingAvailability";
import { ListingRentalModeSwitcher } from "@/components/listings/ListingRentalModeSwitcher";
import { ListingContactCard } from "@/components/listings/ListingContactCard";
import { ListingPortalNote } from "@/components/listings/ListingPortalNote";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import type { ListingWithImages } from "@/lib/types";
import type { ListingPublicContact } from "@/lib/listing-contact";
import { formatAmaDisplay } from "@/lib/rental-types";
import { formatListingAvailabilityText } from "@/lib/listing-availability-status";
import {
  formatPublicMinStayForMode,
  publicMinStayHeading,
  publicPricePrimary,
  publicPriceSecondaryHint,
} from "@/lib/listing-rental-modes";
import { cn } from "@/lib/utils";

export type ListingInterestProps = {
  listing: ListingWithImages;
  contact: ListingPublicContact;
  hostName?: string | null;
  defaultContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

function ListingPriceBlock({
  listing,
  size = "lg",
}: {
  listing: ListingWithImages;
  size?: "lg" | "sm";
}) {
  const tCommon = useTranslations("Common");
  const { mode } = useListingRentalMode();
  const price = publicPricePrimary(listing, mode, null, {
    perNight: tCommon("perNight"),
    perMonth: tCommon("perMonth"),
  });
  const secondaryHint = publicPriceSecondaryHint(listing, mode);
  const titleClass =
    size === "lg" ? "listing-price-display text-3xl" : "listing-price-display text-2xl";

  return (
    <div className="space-y-1">
      <p
        className={cn(
          titleClass,
          mode === "short_term" ? "text-charcoal" : "text-gold"
        )}
      >
        {price.display}
      </p>
      {secondaryHint && (
        <p className="text-xs text-muted">{secondaryHint}</p>
      )}
    </div>
  );
}

function scrollToContact() {
  document.getElementById("listing-contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ListingInterestSidebar({
  listing,
  contact,
  hostName,
  className,
}: Omit<ListingInterestProps, "defaultContact"> & { className?: string }) {
  const tCommon = useTranslations("Common");
  const tListing = useTranslations("Listing");
  const { openInterest } = useListingInterest();
  const { showBoth, showMonthly, mode } = useListingRentalMode();
  const ama = mode === "short_term" ? formatAmaDisplay(listing) : null;

  return (
    <div className={cn("hidden lg:block", className)} id="listing-contact">
      <div className="sticky top-28">
        <GlassCard glow className="p-6">
          {showBoth && <ListingRentalModeSwitcher className="mb-4" />}
          <ListingPriceBlock listing={listing} />
          <p className="mt-1 text-sm text-muted">
            {publicMinStayHeading(mode, tListing)}:{" "}
            {formatPublicMinStayForMode(listing, mode)}
          </p>
          {ama && <p className="mt-1 text-sm text-teal">{ama}</p>}
          {showMonthly && mode === "monthly" && (
            <p className="mt-2 text-sm text-muted">
              {formatListingAvailabilityText(listing, tListing)}
            </p>
          )}
          {mode === "short_term" && (
            <ListingAvailability listing={listing} className="mt-3" size="md" withLabel />
          )}
          {hostName ? (
            <p className="mt-4 text-sm text-charcoal/70">{hostName}</p>
          ) : null}
          <button
            type="button"
            onClick={() => openInterest()}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            {tCommon("expressInterest")}
          </button>
          <ListingContactCard contact={contact} primary className={hostName ? "mt-2" : "mt-4"} />
          <ListingPortalNote className="mt-4" />
        </GlassCard>
      </div>
    </div>
  );
}

export function ListingInterestMobile({
  listing,
  contact,
  hostName,
}: Omit<ListingInterestProps, "defaultContact">) {
  const tCommon = useTranslations("Common");
  const tListing = useTranslations("Listing");
  const { openInterest } = useListingInterest();
  const { mode, showBoth } = useListingRentalMode();
  const stickyPrice = publicPricePrimary(listing, mode, null, {
    perNight: tCommon("perNight"),
    perMonth: tCommon("perMonth"),
  });
  const ama = mode === "short_term" ? formatAmaDisplay(listing) : null;
  const hasDirectPhone = contact.allowPhone && Boolean(contact.phone);

  return (
    <>
      <div
        className="mt-8 space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft lg:hidden"
        id="listing-contact"
      >
        {showBoth && <ListingRentalModeSwitcher />}
        <ListingPriceBlock listing={listing} size="sm" />
        <p className="text-sm text-muted">
          {publicMinStayHeading(mode, tListing)}:{" "}
          {formatPublicMinStayForMode(listing, mode)}
        </p>
        {ama && <p className="text-sm text-teal">{ama}</p>}
        {mode === "short_term" && (
          <ListingAvailability listing={listing} size="md" withLabel />
        )}
        {hostName ? <p className="text-sm text-charcoal/70">{hostName}</p> : null}
        <button
          type="button"
          onClick={() => openInterest()}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
        >
          {tCommon("expressInterest")}
        </button>
        <ListingContactCard contact={contact} primary />
        <ListingPortalNote />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-8px_32px_-8px_rgba(26,26,26,0.12)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "listing-price-display text-lg",
                mode === "short_term" ? "text-charcoal" : "text-gold"
              )}
            >
              {stickyPrice.display}
            </p>
            <p className="text-[11px] text-muted">{tListing("contactChannelsHint")}</p>
          </div>
          <button
            type="button"
            onClick={hasDirectPhone ? scrollToContact : () => openInterest()}
            className="min-h-11 shrink-0 rounded-xl bg-gold px-5 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            {hasDirectPhone ? tCommon("contactPhone") : tCommon("expressInterest")}
          </button>
        </div>
      </div>
    </>
  );
}

/** @deprecated Use ListingInterestSidebar / ListingInterestMobile */
export const ListingBookingSidebar = ListingInterestSidebar;
export const ListingBookingMobile = ListingInterestMobile;
