"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCalendarPriceRule,
  saveCalendarPriceRule,
} from "@/lib/listing-price-rules";
import {
  addDays,
  getUpcomingWeekendRange,
  normalizeDateRange,
  todayDateKey,
} from "@/lib/availability-calendar";
import {
  findPriceRuleForDate,
  hasCustomPriceForDate,
  nightlyPriceForDate,
} from "@/lib/listing-short-term-price";
import { formatUnavailablePeriodRange } from "@/lib/unavailable-periods";
import type { ListingPriceRule } from "@/lib/types";

type Options = {
  listingId: string;
  basePricePerNight: number | null | undefined;
  initialRules: ListingPriceRule[];
};

export function usePriceRulesManager({
  listingId,
  basePricePerNight,
  initialRules,
}: Options) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [priceInput, setPriceInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = todayDateKey();
  const basePrice = basePricePerNight ?? 0;

  const priceForDate = useCallback(
    (dateKey: string) => nightlyPriceForDate(basePricePerNight, rules, dateKey),
    [basePricePerNight, rules]
  );

  const isCustomPrice = useCallback(
    (dateKey: string) => hasCustomPriceForDate(basePricePerNight, rules, dateKey),
    [basePricePerNight, rules]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function priceForSelection(
    selectionStart: string | null,
    selectionEnd: string | null
  ): number {
    if (!selectionStart) return basePrice;
    const key = selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd).start
      : selectionStart;
    return priceForDate(key) ?? basePrice;
  }

  function applyPriceToSelection(
    selectionStart: string | null,
    selectionEnd: string | null,
    onSuccess?: () => void
  ) {
    if (!selectionStart) return;
    const { start, end } = selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd)
      : { start: selectionStart, end: selectionStart };

    const price = parseInt(priceInput, 10);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Συμπλήρωσε έγκυρη τιμή ανά βράδυ.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveCalendarPriceRule(listingId, start, end, price);
      if (result?.error) {
        setError(result.error);
        showToast("Δεν ήταν δυνατή η αποθήκευση της τιμής.");
        return;
      }
      if ("rules" in result && result.rules) setRules(result.rules);
      onSuccess?.();
      router.refresh();
      showToast("Η τιμή εφαρμόστηκε στις επιλεγμένες ημερομηνίες.");
    });
  }

  function resetCustomPriceForSelection(
    selectionStart: string | null,
    selectionEnd: string | null,
    onSuccess?: () => void
  ) {
    if (!selectionStart) return;
    const { start, end } = selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd)
      : { start: selectionStart, end: selectionStart };

    const rule =
      findPriceRuleForDate(rules, start) ??
      (end !== start ? findPriceRuleForDate(rules, end) : null);

    if (!rule || !hasCustomPriceForDate(basePricePerNight, rules, start)) {
      setError("Η επιλογή δεν έχει ειδική τιμή.");
      return;
    }

    const label = formatUnavailablePeriodRange(rule.start_date, rule.end_date);
    if (!confirm(`Να επαναφερθεί η βασική τιμή (€${basePrice}) για ${label};`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteCalendarPriceRule(listingId, rule.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if ("rules" in result && result.rules) setRules(result.rules);
      onSuccess?.();
      router.refresh();
      showToast("Η ειδική τιμή αφαιρέθηκε.");
    });
  }

  function suggestWeekendPrice(): number {
    return Math.max(Math.round(basePrice * 1.25), basePrice + 20, 1);
  }

  const selectionHasCustomPrice = useCallback(
    (selectionStart: string | null, selectionEnd: string | null) => {
      if (!selectionStart) return false;
      if (!selectionEnd) return isCustomPrice(selectionStart);
      const { start, end } = normalizeDateRange(selectionStart, selectionEnd);
      let key = start;
      while (key <= end) {
        if (isCustomPrice(key)) return true;
        key = addDays(key, 1);
      }
      return false;
    },
    [isCustomPrice]
  );

  return {
    rules,
    priceInput,
    setPriceInput,
    error,
    toast,
    pending,
    today,
    basePrice,
    priceForDate,
    isCustomPrice,
    priceForSelection,
    applyPriceToSelection,
    resetCustomPriceForSelection,
    selectionHasCustomPrice,
    suggestWeekendPrice,
    getUpcomingWeekendRange,
  };
}
