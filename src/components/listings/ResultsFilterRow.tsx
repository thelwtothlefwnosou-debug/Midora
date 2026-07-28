"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  buildFilterChips,
  removeFilterChip,
  type FilterChip,
} from "@/lib/filter-chips";
import { resetListingsPage } from "@/lib/listings-pagination";
import { cn } from "@/lib/utils";

type Props = {
  onOpenFilters: () => void;
  filterBadge?: number;
  className?: string;
};

export function ResultsFilterRow({ onOpenFilters, filterBadge = 0, className }: Props) {
  const t = useTranslations("Listings");
  const tListing = useTranslations("Listing");
  const tChip = useTranslations("Listings.chip");
  const tType = useTranslations("PropertyTypes");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChips = buildFilterChips(searchParams, {
    includeRentalType: false,
    t: (key, values) => tChip(key, values),
    propertyTypeT: (key) => tType(key),
    locale,
  });

  const quickChips = [
    { id: "price", label: t("price") },
    { id: "type", label: t("propertyType") },
    { id: "amenities", label: tListing("amenities") },
    { id: "bedrooms", label: t("bedrooms") },
  ] as const;

  function removeChip(chip: FilterChip) {
    const next = resetListingsPage(
      removeFilterChip(new URLSearchParams(searchParams.toString()), chip)
    );
    if (!next.get("rentalType")) next.set("rentalType", "short_term");
    const qs = next.toString();
    router.push(`/listings?${qs}`);
  }

  function clearAll() {
    const rt = searchParams.get("rentalType");
    router.push(
      rt === "monthly" || rt === "short_term"
        ? `/listings?rentalType=${rt}`
        : "/listings?rentalType=short_term"
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-8 items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-charcoal/30"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        {t("filters")}
        {filterBadge > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 text-[9px] font-bold text-white">
            {filterBadge}
          </span>
        )}
      </button>

      {quickChips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={onOpenFilters}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-charcoal/30"
        >
          {chip.label}
          <ChevronDown className="h-3 w-3 text-muted" aria-hidden />
        </button>
      ))}

      {activeChips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeChip(chip)}
          className="inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-full border border-charcoal/20 bg-charcoal/[0.04] px-2.5 py-1.5 text-xs font-medium text-charcoal"
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">{t("removeFilter")}</span>
        </button>
      ))}

      {activeChips.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="shrink-0 px-1 text-xs font-medium text-muted underline-offset-2 hover:text-charcoal hover:underline"
        >
          {t("clear")}
        </button>
      )}
    </div>
  );
}
