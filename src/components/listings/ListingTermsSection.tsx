"use client";

import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import { useTranslations } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import {
  formatPublicMinStayForMode,
  publicMinStayHeading,
  resolveMonthlyIncludesBills,
} from "@/lib/listing-rental-modes";

export function ListingTermsSection({ listing }: { listing: ListingWithImages }) {
  const { mode } = useListingRentalMode();
  const t = useTranslations("Listing");
  const tCommon = useTranslations("Common");

  const items: string[] = [];

  if (mode === "short_term") {
    items.push(
      `${publicMinStayHeading(mode)}: ${formatPublicMinStayForMode(listing, mode)}`
    );
    if (listing.included_guests != null) {
      items.push(t("includedGuestsInPrice", { count: listing.included_guests }));
    }
    if (listing.extra_guest_fee_per_night != null) {
      items.push(
        t("extraGuestFeePerNight", {
          amount: listing.extra_guest_fee_per_night.toLocaleString(undefined),
        })
      );
    }
    items.push(listing.pets_allowed ? t("petsAllowed") : t("petsNotAllowed"));
    items.push(
      listing.cleaning_included ? tCommon("cleaningIncluded") : tCommon("cleaningNotIncluded")
    );
  } else {
    items.push(
      `${publicMinStayHeading(mode)}: ${formatPublicMinStayForMode(listing, mode)}`
    );
    items.push(
      resolveMonthlyIncludesBills(listing)
        ? tCommon("utilitiesIncluded")
        : tCommon("utilitiesNotIncluded")
    );
    items.push(listing.pets_allowed ? t("petsAllowed") : t("petsNotAllowed"));
    items.push(
      listing.cleaning_included ? tCommon("cleaningIncluded") : tCommon("cleaningNotIncluded")
    );
    items.push(listing.furnished ? t("furnished") : t("unfurnished"));
    if (listing.monthly_terms?.trim()) {
      items.push(listing.monthly_terms.trim());
    }
  }

  return (
    <section className="listing-section">
      <h2 className="listing-section-title">{t("termsTitle")}</h2>
      <p className="listing-meta mt-3">{t("termsIntro")}</p>
      <ul className="listing-card mt-5 space-y-2 p-5 text-sm text-charcoal/85">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-gold">•</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
