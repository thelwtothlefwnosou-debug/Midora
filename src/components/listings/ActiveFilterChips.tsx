"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  buildFilterChips,
  removeFilterChip,
  type FilterChip,
} from "@/lib/filter-chips";
import { resetListingsPage } from "@/lib/listings-pagination";

export function ActiveFilterChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Listings");
  const tChip = useTranslations("Listings.chip");
  const tType = useTranslations("PropertyTypes");
  const locale = useLocale();
  const chips = buildFilterChips(searchParams, {
    t: (key, values) => tChip(key, values),
    propertyTypeT: (key) => tType(key),
    locale,
  });

  if (chips.length === 0) return null;

  function removeChip(chip: FilterChip) {
    const next = resetListingsPage(
      removeFilterChip(new URLSearchParams(searchParams.toString()), chip)
    );
    if (!next.get("rentalType")) next.set("rentalType", "short_term");
    router.push(`/listings?${next.toString()}`);
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
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-4 py-2.5 sm:px-6">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeChip(chip)}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-gold/25 bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-gold/45 hover:bg-sand/40"
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">{t("removeFilter")}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs font-medium text-muted underline-offset-2 hover:text-charcoal hover:underline"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
