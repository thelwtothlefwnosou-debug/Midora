import type { RentalType } from "@/lib/rental-types";
import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";

export type ModeFieldCache = {
  short_term: { interestFrom?: string; interestTo?: string };
  monthly: { startMonth?: string; durationMonths?: string };
};

export function createModeFieldCache(
  defaults: ListingsFilterValues
): ModeFieldCache {
  return {
    short_term: {
      interestFrom: defaults.interestFrom,
      interestTo: defaults.interestTo,
    },
    monthly: {
      startMonth: defaults.startMonth,
      durationMonths: defaults.durationMonths,
    },
  };
}

/** Preserve shared filters; swap only mode-specific date fields. */
export function applyRentalModeSwitch(
  values: ListingsFilterValues,
  from: RentalType,
  to: RentalType,
  cache: ModeFieldCache
): ListingsFilterValues {
  if (from === "short_term") {
    cache.short_term = {
      interestFrom: values.interestFrom,
      interestTo: values.interestTo,
    };
  } else {
    cache.monthly = {
      startMonth: values.startMonth,
      durationMonths: values.durationMonths,
    };
  }

  const next: ListingsFilterValues = { ...values, rentalType: to };

  if (to === "short_term") {
    next.startMonth = undefined;
    next.durationMonths = undefined;
    next.interestFrom = cache.short_term.interestFrom;
    next.interestTo = cache.short_term.interestTo;
  } else {
    next.interestFrom = undefined;
    next.interestTo = undefined;
    next.freeHosting = undefined;
    const checkInMonth = values.interestFrom?.trim().slice(0, 7);
    next.startMonth = cache.monthly.startMonth || checkInMonth || undefined;
    next.durationMonths = cache.monthly.durationMonths || "2";
  }

  return next;
}
