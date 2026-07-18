"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRangeValue } from "@/components/availability/InterestDateRangePicker";
import {
  applyDateRangeToSearchParams,
  applyGuestsToSearchParams,
  saveLastSearchState,
} from "@/lib/midora-search-state";

export function useListingSearchUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceParams = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      saveLastSearchState(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      // Keep listing scroll + sticky inquiry card stable when dates/guests sync to URL.
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      router.replace(url, { scroll: false });
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - scrollY) > 1) {
            window.scrollTo(0, scrollY);
          }
        });
      }
    },
    [pathname, router]
  );

  const syncDateRange = useCallback(
    (range: DateRangeValue) => {
      const next = applyDateRangeToSearchParams(
        new URLSearchParams(searchParams.toString()),
        range
      );
      replaceParams(next);
    },
    [replaceParams, searchParams]
  );

  const syncGuests = useCallback(
    (guests: number) => {
      const next = applyGuestsToSearchParams(
        new URLSearchParams(searchParams.toString()),
        guests
      );
      replaceParams(next);
    },
    [replaceParams, searchParams]
  );

  return { syncDateRange, syncGuests };
}
