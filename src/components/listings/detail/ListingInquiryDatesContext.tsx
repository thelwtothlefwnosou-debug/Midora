"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { DateRangeValue } from "@/components/availability/InterestDateRangePicker";
import {
  meetsMinimumStayNights,
  normalizeDateRange,
} from "@/lib/availability-calendar";
import type { ListingPublicDetail } from "@/lib/types";
import { resolveMinimumStayNights } from "@/lib/listing-rental-modes";

type ContextValue = {
  appliedRange: DateRangeValue;
  setAppliedRange: (v: DateRangeValue) => void;
  guests: number;
  setGuests: (n: number) => void;
  range: { start: string; end: string } | null;
  pendingCheckIn: string | null;
  rangeMeetsMinStay: boolean;
  minimumStayNights: number;
  maxGuests: number;
  clearDates: () => void;
};

const ListingInquiryDatesContext = createContext<ContextValue | null>(null);

export function ListingInquiryDatesProvider({
  listing,
  children,
}: {
  listing: ListingPublicDetail;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const [appliedRange, setAppliedRange] = useState<DateRangeValue>(null);
  const minimumStayNights = resolveMinimumStayNights(listing);
  const maxGuests = listing.max_guests ?? 16;
  const [guests, setGuests] = useState(
    Math.min(listing.max_guests ?? 2, listing.included_guests ?? 2) || 2
  );

  useEffect(() => {
    const from =
      searchParams.get("interestFrom")?.trim() ||
      searchParams.get("start")?.trim() ||
      "";
    const to =
      searchParams.get("interestTo")?.trim() ||
      searchParams.get("end")?.trim() ||
      "";
    const guestsRaw = searchParams.get("guests")?.trim();

    if (from && to) setAppliedRange({ start: from, end: to });
    if (guestsRaw) {
      const parsed = parseInt(guestsRaw, 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        setGuests(Math.min(parsed, maxGuests));
      }
    }
  }, [maxGuests, searchParams]);

  const range = useMemo(() => {
    if (!appliedRange?.start || !appliedRange.end) return null;
    if (appliedRange.start === appliedRange.end) return null;
    return normalizeDateRange(appliedRange.start, appliedRange.end);
  }, [appliedRange]);

  const pendingCheckIn =
    appliedRange?.start && appliedRange.start === appliedRange.end
      ? appliedRange.start
      : range?.start ?? null;

  const rangeMeetsMinStay =
    range != null &&
    meetsMinimumStayNights(range.start, range.end, minimumStayNights);

  function clearDates() {
    setAppliedRange(null);
  }

  return (
    <ListingInquiryDatesContext.Provider
      value={{
        appliedRange,
        setAppliedRange,
        guests,
        setGuests,
        range,
        pendingCheckIn,
        rangeMeetsMinStay,
        minimumStayNights,
        maxGuests,
        clearDates,
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
