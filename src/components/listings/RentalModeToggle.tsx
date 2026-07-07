"use client";

import { RENTAL_TYPE_SEARCH_TABS } from "@/lib/homepage-content";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

type Props = {
  value: RentalType;
  onChange: (value: RentalType) => void;
  className?: string;
};

export function RentalModeToggle({ value, onChange, className }: Props) {
  return (
    <div
      className={cn("listings-search-dock__mode shrink-0", className)}
      role="tablist"
      aria-label="Τύπος μίσθωσης"
    >
      <div className="listings-search-mode-switch">
        {RENTAL_TYPE_SEARCH_TABS.map((tab) => {
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
              <span className="hidden xl:inline">{tab.label}</span>
              <span className="xl:hidden">
                {tab.value === "monthly" ? "Μηνιαία" : "Βραχυχρόνια"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
