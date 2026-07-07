"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUnavailablePeriod, saveUnavailablePeriod } from "@/lib/actions";
import {
  addMonths,
  getFullMonthRange,
  getRangeFromToday,
  getUpcomingWeekendRange,
  normalizeDateRange,
  periodDurationDays,
  todayDateKey,
} from "@/lib/availability-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { formatUnavailablePeriodRange } from "@/lib/unavailable-periods";

type Options = {
  listingId: string;
  initialPeriods: ListingUnavailablePeriod[];
};

export function useUnavailablePeriodsManager({ listingId, initialPeriods }: Options) {
  const router = useRouter();
  const [items, setItems] = useState(initialPeriods);
  const [month, setMonth] = useState(() => new Date());
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = todayDateKey();

  function clearSelection() {
    setSelectionStart(null);
    setSelectionEnd(null);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function applyPeriods(next: ListingUnavailablePeriod[]) {
    setItems(next);
    router.refresh();
  }

  function findPeriodForDate(dateKey: string): ListingUnavailablePeriod | undefined {
    return items.find((p) => dateKey >= p.start_date && dateKey <= p.end_date);
  }

  function saveRange(start: string, end: string, onSuccess?: () => void) {
    setError(null);

    if (end < start) {
      setError("Η ημερομηνία λήξης πρέπει να είναι ίδια ή μεταγενέστερη από την ημερομηνία έναρξης.");
      return;
    }
    if (end < today) {
      setError("Δεν μπορείς να δηλώσεις μη διαθεσιμότητα στο παρελθόν.");
      return;
    }

    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("start_date", start);
    fd.set("end_date", end);
    fd.set("reason", "unavailable");
    fd.set("force_overlap", "true");

    startTransition(async () => {
      const result = await saveUnavailablePeriod(fd);
      if (result?.error) {
        setError(result.error);
        showToast("Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.");
        return;
      }
      if (result?.periods) {
        applyPeriods(result.periods as ListingUnavailablePeriod[]);
      }
      clearSelection();
      onSuccess?.();
      showToast("Οι ημερομηνίες σημειώθηκαν ως μη διαθέσιμες.");
    });
  }

  function handleDateClick(dateKey: string) {
    if (dateKey < today) return;

    const existingPeriod = findPeriodForDate(dateKey);
    if (existingPeriod) {
      const label = formatUnavailablePeriodRange(
        existingPeriod.start_date,
        existingPeriod.end_date
      );
      if (
        !confirm(
          `Να γίνουν ξανά διαθέσιμες οι ημερομηνίες ${label};`
        )
      ) {
        return;
      }
      handleDelete(existingPeriod.id, { skipConfirm: true });
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
  }

  function markSelectionUnavailable() {
    if (!selectionStart) return;
    const { start, end } = selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd)
      : { start: selectionStart, end: selectionStart };
    saveRange(start, end);
  }

  function applyQuickRange(getRange: () => { start: string; end: string }) {
    const range = getRange();
    const start = range.start < today ? today : range.start;
    setSelectionStart(start);
    setSelectionEnd(range.end);
    saveRange(start, range.end);
  }

  function handleDelete(
    periodId: string,
    options?: { skipConfirm?: boolean }
  ) {
    if (
      !options?.skipConfirm &&
      !confirm("Θέλεις να διαγράψεις αυτή τη μη διαθέσιμη περίοδο;")
    ) {
      return;
    }
    setDeleteId(periodId);
    startTransition(async () => {
      const result = await deleteUnavailablePeriod(periodId, listingId);
      setDeleteId(null);
      if (result?.error) {
        setError(result.error);
        showToast("Δεν ήταν δυνατή η αλλαγή. Δοκίμασε ξανά.");
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== periodId));
      clearSelection();
      router.refresh();
      showToast("Οι ημερομηνίες είναι πάλι διαθέσιμες.");
    });
  }

  const selectionLabel =
    selectionStart &&
    (selectionEnd
      ? formatUnavailablePeriodRange(
          normalizeDateRange(selectionStart, selectionEnd).start,
          normalizeDateRange(selectionStart, selectionEnd).end
        )
      : formatUnavailablePeriodRange(selectionStart, selectionStart));

  return {
    items,
    month,
    setMonth,
    selectionStart,
    selectionEnd,
    error,
    toast,
    deleteId,
    pending,
    today,
    selectionLabel,
    clearSelection,
    handleDateClick,
    markSelectionUnavailable,
    blockRange: saveRange,
    handleDelete,
    applyQuickRange,
    addMonths,
    getFullMonthRange,
    getRangeFromToday,
    getUpcomingWeekendRange,
    periodDurationDays,
  };
}
