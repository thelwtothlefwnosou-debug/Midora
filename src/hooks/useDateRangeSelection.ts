"use client";

import { useCallback, useState } from "react";
import {
  getDateDisabledReason,
  isRangeSelectable,
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
  listingId: _listingId,
  minimumStayNights: _minimumStayNights,
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
        return;
      }

      if (!selectionStart || (selectionStart && selectionEnd)) {
        setSelectionStart(dateKey);
        setSelectionEnd(null);
        return;
      }

      const { start, end } = normalizeDateRange(selectionStart, dateKey);
      setSelectionStart(start);
      setSelectionEnd(end);
    },
    [periods, selectionEnd, selectionStart]
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
