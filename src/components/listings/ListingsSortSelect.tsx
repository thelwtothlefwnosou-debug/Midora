"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingSort } from "@/lib/types";
import { resetListingsPage } from "@/lib/listings-pagination";

const SORT_VALUES: ListingSort[] = [
  "recommended",
  "newest",
  "price_asc",
  "price_desc",
  "amenities_desc",
  "bedrooms_desc",
];

type Props = {
  className?: string;
  compact?: boolean;
};

export function ListingsSortSelect({ className, compact }: Props) {
  const t = useTranslations("Listings.sort");
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") as ListingSort) || "recommended";

  const labelByValue: Record<ListingSort, string> = {
    recommended: t("recommended"),
    newest: t("newest"),
    price_asc: t("priceAsc"),
    price_desc: t("priceDesc"),
    amenities_desc: t("amenitiesDesc"),
    bedrooms_desc: t("bedroomsDesc"),
  };

  function handleChange(value: string) {
    const params = resetListingsPage(new URLSearchParams(searchParams.toString()));
    if (value === "recommended") params.delete("sort");
    else params.set("sort", value);
    const q = params.toString();
    router.push(q ? `/listings?${q}` : "/listings", { scroll: false });
  }

  return (
    <label
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2",
        className
      )}
    >
      <ArrowUpDown className="h-4 w-4 shrink-0 text-gold/80" />
      {!compact && (
        <span className="hidden text-[9px] font-medium tracking-wider text-muted uppercase sm:inline">
          {t("label")}
        </span>
      )}
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        aria-label={t("ariaLabel")}
        className="max-w-[9.5rem] cursor-pointer bg-transparent text-sm font-medium text-charcoal outline-none sm:max-w-none"
      >
        {SORT_VALUES.map((value) => (
          <option key={value} value={value} className="bg-white">
            {labelByValue[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
