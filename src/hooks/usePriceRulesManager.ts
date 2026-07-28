"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  resolveNightlyPrice,
  type ShortTermPricingConfig,
} from "@/lib/listing-short-term-price";
import { formatUnavailablePeriodRange } from "@/lib/unavailable-periods";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import type { ListingPriceRule } from "@/lib/types";

type Options = {
  listingId: string;
  pricing: ShortTermPricingConfig;
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
  initialRules: ListingPriceRule[];
};

function countDaysInRange(start: string, end: string): number {
  let count = 0;
  let key = start;
  while (key <= end) {
    count++;
    key = addDays(key, 1);
  }
  return count;
}

export function usePriceRulesManager({
  listingId,
  pricing,
  periods,
  initialRules,
}: Options) {
  const t = useTranslations("Workspace.calendar");
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [priceInput, setPriceInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = todayDateKey();
  const basePrice = pricing.price_per_night ?? 0;

  const priceForDate = useCallback(
    (dateKey: string) => resolveNightlyPrice(pricing, rules, periods, dateKey),
    [pricing, rules, periods]
  );

  const isCustomPrice = useCallback(
    (dateKey: string) => hasCustomPriceForDate(pricing, rules, dateKey),
    [pricing, rules]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
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

    const dayCount = countDaysInRange(start, end);
    if (dayCount > 1) {
      const ok = confirm(t("confirmApplyMultiDay", { count: dayCount }));
      if (!ok) return;
    }

    const price = parseInt(priceInput, 10);
    if (!Number.isFinite(price) || price <= 0) {
      setError(t("invalidPrice"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveCalendarPriceRule(listingId, start, end, price);
      if (result?.error) {
        setError(result.error);
        showToast(t("savePriceFailed"));
        return;
      }
      if ("rules" in result && result.rules) setRules(result.rules);
      onSuccess?.();
      router.refresh();
      showToast(t("priceApplied"));
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

    if (!rule || !hasCustomPriceForDate(pricing, rules, start)) {
      setError(t("noCustomPrice"));
      return;
    }

    const label = formatUnavailablePeriodRange(rule.start_date, rule.end_date);
    if (!confirm(t("confirmResetBase", { price: basePrice, label }))) {
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
      showToast(t("customPriceRemoved"));
    });
  }

  function suggestWeekendPrice(): number {
    return (
      pricing.weekend_price_per_night ??
      Math.max(Math.round(basePrice * 1.25), basePrice + 20, 1)
    );
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
    applyPriceToSelection,
    resetCustomPriceForSelection,
    selectionHasCustomPrice,
    suggestWeekendPrice,
    getUpcomingWeekendRange,
  };
}
