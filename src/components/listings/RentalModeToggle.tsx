"use client";

import { useTranslations } from "next-intl";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

const TABS: { value: RentalType; labelKey: "shortTerm" | "monthlyMidterm"; shortKey: "shortTerm" | "monthly" }[] = [
  { value: "short_term", labelKey: "shortTerm", shortKey: "shortTerm" },
  { value: "monthly", labelKey: "monthlyMidterm", shortKey: "monthly" },
];

type Props = {
  value: RentalType;
  onChange: (value: RentalType) => void;
  className?: string;
};

export function RentalModeToggle({ value, onChange, className }: Props) {
  const tListing = useTranslations("Listing");
  const tSearch = useTranslations("Search");

  return (
    <div
      className={cn("listings-search-dock__mode shrink-0", className)}
      role="tablist"
      aria-label={tSearch("rentalType")}
    >
      <div className="listings-search-mode-switch">
        {TABS.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "listings-search-mode-switch__tab",
                active && "listings-search-mode-switch__tab--active"
              )}
            >
              <span className="hidden xl:inline">{tListing(tab.labelKey)}</span>
              <span className="xl:hidden">{tSearch(tab.shortKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
