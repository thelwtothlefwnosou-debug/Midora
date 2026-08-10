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
  /** dock = search bar chrome; standalone = homepage / free-standing switch */
  variant?: "dock" | "standalone";
};

export function RentalModeToggle({
  value,
  onChange,
  className,
  variant = "dock",
}: Props) {
  const tListing = useTranslations("Listing");
  const tSearch = useTranslations("Search");
  const fullFrom = variant === "standalone" ? "sm" : "xl";

  return (
    <div
      className={cn(
        variant === "dock" && "listings-search-dock__mode shrink-0",
        variant === "standalone" && "shrink-0",
        className
      )}
      role="tablist"
      aria-label={tSearch("rentalType")}
    >
      <div
        className={cn(
          "listings-search-mode-switch",
          variant === "standalone" && "w-full sm:w-auto"
        )}
      >
        {TABS.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={tListing(tab.labelKey)}
              onClick={() => onChange(tab.value)}
              className={cn(
                "listings-search-mode-switch__tab",
                variant === "standalone" && "flex-1 sm:flex-none",
                active && "listings-search-mode-switch__tab--active"
              )}
            >
              <span
                className={fullFrom === "sm" ? "hidden sm:inline" : "hidden xl:inline"}
                aria-hidden
              >
                {tListing(tab.labelKey)}
              </span>
              <span
                className={fullFrom === "sm" ? "sm:hidden" : "xl:hidden"}
                aria-hidden
              >
                {tSearch(tab.shortKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
