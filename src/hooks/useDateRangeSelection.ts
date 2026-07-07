"use client";

import { useCallback, useState } from "react";
import {
  getDateDisabledReason,
  isRangeSelectable,
  logCalendarSelectionDebug,
  normalizeDateRange,
} from "@/lib/availability-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

type Period = Pick<ListingUnavailablePeriod, "start_date" | "end_date">;

type Options = {
  periods?: Period[];
  listingId?: string;
  minimumStayNights?: number;
};

export function useDateRangeSelection({
  periods = [],
  listingId,
  minimumStayNights,
}: Options = {}) {
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);

  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  const setRange = useCallback(
    (start: string | null, end: string | null) => {
      if (!start) {
        clearSelection();
        return;
      }
      if (!end) {
        setSelectionStart(start);
        setSelectionEnd(null);
        return;
      }
      const { start: s, end: e } = normalizeDateRange(start, end);
      setSelectionStart(s);
      setSelectionEnd(e);
    },
    [clearSelection]
  );

  const handleDateClick = useCallback(
    (dateKey: string) => {
      const disabledReason = getDateDisabledReason(dateKey, periods);
      if (disabledReason) {
        logCalendarSelectionDebug({
          listingId,
          currentDate: dateKey,
          selectedStart: selectionStart,
          selectedEnd: selectionEnd,
          minimumStayNights,
          unavailablePeriods: periods,
          disabledReason,
        });
        return;
      }

      if (!selectionStart || (selectionStart && selectionEnd)) {
        setSelectionStart(dateKey);
        setSelectionEnd(null);
        logCalendarSelectionDebug({
          listingId,
          currentDate: dateKey,
          selectedStart: dateKey,
          selectedEnd: null,
          minimumStayNights,
          unavailablePeriods: periods,
          disabledReason: null,
        });
        return;
      }

      const { start, end } = normalizeDateRange(selectionStart, dateKey);
      setSelectionStart(start);
      setSelectionEnd(end);
      logCalendarSelectionDebug({
        listingId,
        currentDate: dateKey,
        selectedStart: start,
        selectedEnd: end,
        minimumStayNights,
        unavailablePeriods: periods,
        disabledReason: null,
      });
    },
    [listingId, minimumStayNights, periods, selectionEnd, selectionStart]
  );

  const resolvedRange =
    selectionStart && selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd)
      : selectionStart
        ? { start: selectionStart, end: selectionStart }
        : null;

  const hasCompleteRange = Boolean(selectionStart && selectionEnd);

  const isRangeValid =
    hasCompleteRange &&
    isRangeSelectable(selectionStart!, selectionEnd!, periods);

  const isComplete = hasCompleteRange && isRangeValid;

  return {
    selectionStart,
    selectionEnd,
    resolvedRange,
    hasCompleteRange,
    isRangeValid,
    isComplete,
    clearSelection,
    setRange,
    handleDateClick,
    setSelectionStart,
    setSelectionEnd,
  };
}
