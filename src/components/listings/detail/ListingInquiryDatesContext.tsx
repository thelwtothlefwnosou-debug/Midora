"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { DateRangeValue } from "@/components/availability/InterestDateRangePicker";
import {
  meetsMinimumStayNights,
  normalizeDateRange,
} from "@/lib/availability-calendar";
import { getDefaultFiveNightRange } from "@/lib/listing-default-stay-range";
import { useListingSearchUrlSync } from "@/hooks/useListingSearchUrlSync";
import { parseDateRangeFromSearchParams } from "@/lib/midora-search-state";
import type { ListingPublicDetail } from "@/lib/types";
import { resolveMinimumStayNights } from "@/lib/listing-rental-modes";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

export type DisplayRangeSource = "user" | "default-preview" | null;

type ContextValue = {
  /** Dates chosen by the visitor (URL or calendar). */
  userSelectedRange: DateRangeValue;
  setUserSelectedRange: (v: DateRangeValue) => void;
  /** Auto 5-night preview when no user selection exists. */
  defaultPreviewRange: ReturnType<typeof getDefaultFiveNightRange>;
  /** Range shown in card + calendar + price. */
  displayRange: { start: string; end: string } | null;
  displayRangeSource: DisplayRangeSource;
  guests: number;
  setGuests: (n: number) => void;
  pendingCheckIn: string | null;
  rangeMeetsMinStay: boolean;
  minimumStayNights: number;
  maxGuests: number;
  clearDates: () => void;
  /** @deprecated Use userSelectedRange */
  appliedRange: DateRangeValue;
  /** @deprecated Use setUserSelectedRange */
  setAppliedRange: (v: DateRangeValue) => void;
  /** @deprecated Use displayRange */
  range: { start: string; end: string } | null;
};

const ListingInquiryDatesContext = createContext<ContextValue | null>(null);

export function ListingInquiryDatesProvider({
  listing,
  periods = [],
  children,
}: {
  listing: ListingPublicDetail;
  periods?: ListingUnavailablePeriod[];
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const { syncDateRange, syncGuests } = useListingSearchUrlSync();
  const userTouchedDatesRef = useRef(false);
  const guestsInitializedRef = useRef(false);

  const [userSelectedRange, setUserSelectedRangeState] = useState<DateRangeValue>(() =>
    parseDateRangeFromSearchParams(searchParams)
  );
  const minimumStayNights = resolveMinimumStayNights(listing);
  const maxGuests = listing.max_guests ?? 16;
  const [guests, setGuestsState] = useState(() => {
    const guestsRaw = searchParams.get("guests")?.trim();
    if (guestsRaw) {
      const parsed = parseInt(guestsRaw, 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        return Math.min(parsed, maxGuests);
      }
    }
    return Math.min(listing.max_guests ?? 2, listing.included_guests ?? 2) || 2;
  });

  const defaultPreviewRange = useMemo(
    () =>
      getDefaultFiveNightRange(
        listing,
        listing.price_rules ?? [],
        periods,
        minimumStayNights,
        guests
      ),
    [guests, listing, minimumStayNights, periods]
  );

  useEffect(() => {
    if (userTouchedDatesRef.current) return;
    const parsed = parseDateRangeFromSearchParams(searchParams);
    setUserSelectedRangeState(parsed);
  }, [searchParams]);

  useEffect(() => {
    const guestsRaw = searchParams.get("guests")?.trim();
    if (!guestsRaw) return;
    const parsed = parseInt(guestsRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    if (!guestsInitializedRef.current) {
      guestsInitializedRef.current = true;
      setGuestsState(Math.min(parsed, maxGuests));
    }
  }, [maxGuests, searchParams]);

  const setUserSelectedRange = useCallback(
    (v: DateRangeValue) => {
      userTouchedDatesRef.current = true;
      setUserSelectedRangeState(v);
      syncDateRange(v);
    },
    [syncDateRange]
  );

  const setGuests = useCallback(
    (n: number) => {
      const clamped = Math.max(1, Math.min(n, maxGuests));
      setGuestsState(clamped);
      syncGuests(clamped);
    },
    [maxGuests, syncGuests]
  );

  const userRange = useMemo(() => {
    if (!userSelectedRange?.start || !userSelectedRange.end) return null;
    if (userSelectedRange.start === userSelectedRange.end) return null;
    return normalizeDateRange(userSelectedRange.start, userSelectedRange.end);
  }, [userSelectedRange]);

  const hasUserDateInteraction = userSelectedRange != null;

  const displayRange = useMemo(() => {
    if (userRange) return userRange;
    if (hasUserDateInteraction) return null;
    if (defaultPreviewRange) {
      return {
        start: defaultPreviewRange.checkIn,
        end: defaultPreviewRange.checkOut,
      };
    }
    return null;
  }, [defaultPreviewRange, hasUserDateInteraction, userRange]);

  const displayRangeSource: DisplayRangeSource = useMemo(() => {
    if (userRange) return "user";
    if (!hasUserDateInteraction && defaultPreviewRange && displayRange) {
      return "default-preview";
    }
    return null;
  }, [defaultPreviewRange, displayRange, hasUserDateInteraction, userRange]);

  const pendingCheckIn =
    userSelectedRange?.start && userSelectedRange.start === userSelectedRange.end
      ? userSelectedRange.start
      : displayRange?.start ?? null;

  const rangeMeetsMinStay =
    displayRange != null &&
    meetsMinimumStayNights(displayRange.start, displayRange.end, minimumStayNights);

  const clearDates = useCallback(() => {
    userTouchedDatesRef.current = true;
    setUserSelectedRangeState(null);
    syncDateRange(null);
  }, [syncDateRange]);

  return (
    <ListingInquiryDatesContext.Provider
      value={{
        userSelectedRange,
        setUserSelectedRange,
        defaultPreviewRange,
        displayRange,
        displayRangeSource,
        guests,
        setGuests,
        pendingCheckIn,
        rangeMeetsMinStay,
        minimumStayNights,
        maxGuests,
        clearDates,
        appliedRange: userSelectedRange,
        setAppliedRange: setUserSelectedRange,
        range: displayRange,
      }}
    >
      {children}
    </ListingInquiryDatesContext.Provider>
  );
}

export function useListingInquiryDates() {
  const ctx = useContext(ListingInquiryDatesContext);
  if (!ctx) {
    throw new Error("useListingInquiryDates must be used within ListingInquiryDatesProvider");
  }
  return ctx;
}
