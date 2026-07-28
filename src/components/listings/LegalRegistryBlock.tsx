"use client";

import { useTranslations } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import {
  formatAmaDisplay,
  getLegalRegistryRegisteredBadge,
  needsPublicRegistryDisplay,
} from "@/lib/rental-types";
import { cn } from "@/lib/utils";

export function LegalRegistryBlock({
  listing,
  className,
}: {
  listing: ListingWithImages;
  className?: string;
}) {
  const t = useTranslations("Listing");

  if (!needsPublicRegistryDisplay(listing)) return null;

  const display = formatAmaDisplay(listing);
  const badge = getLegalRegistryRegisteredBadge(listing, t);

  if (!display && !badge) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-teal/20 bg-teal/5 px-4 py-3",
        className
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-teal uppercase">
        {t("registrySection.title")}
      </p>
      {badge && (
        <span className="mt-2 inline-block rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-teal">
          {badge}
        </span>
      )}
      {display && (
        <p className="mt-2 font-display text-lg font-semibold text-charcoal">{display}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-muted">{t("registrySection.disclaimer")}</p>
    </div>
  );
}
