import type { ListingFilters } from "@/lib/types";
import { pickLocale, intlLocale } from "@/lib/locale-fallbacks";
import { toDateKey } from "@/lib/availability-calendar";
export const MID_TERM_DURATION_OPTIONS = [
  { value: 2, label: "2 μήνες", labelKey: "months2" },
  { value: 3, label: "3 μήνες", labelKey: "months3" },
  { value: 6, label: "6 μήνες", labelKey: "months6" },
  { value: 9, label: "9 μήνες", labelKey: "months9" },
  { value: 12, label: "12+ μήνες", labelKey: "months12plus" },
] as const;

export const LONG_TERM_DURATION_OPTIONS = [
  { value: 12, label: "12+ μήνες", labelKey: "months12plus" },
  { value: 0, label: "Κατόπιν συνεννόησης", labelKey: "uponRequest" },
] as const;

export function monthlyInterestRange(
  startMonth: string,
  durationMonths: number
): { from: string; to: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(startMonth.trim());
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month - 1 + durationMonths, 0);
  return { from: toDateKey(start), to: toDateKey(end) };
}

/** Resolve search filters to an interest date range for availability filtering */
export function resolveInterestDateRange(
  filters: ListingFilters
): { from: string; to: string } | null {
  if (filters.interestFrom && filters.interestTo) {
    return { from: filters.interestFrom, to: filters.interestTo };
  }
  if (filters.interestStartMonth && filters.interestDurationMonths) {
    return monthlyInterestRange(
      filters.interestStartMonth,
      filters.interestDurationMonths
    );
  }
  return null;
}

export function formatInterestRangeLabel(from: string, to: string, locale?: string): string {
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(new Date(from))} – ${fmt.format(new Date(to))}`;
}

export function formatMonthLabel(yyyyMm: string, locale?: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!match) return yyyyMm;
  const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1);
  return new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(d);
}

export function midTermDurationLabel(value: number, locale?: string): string {
  if (value === 12) return pickLocale(locale, "12+ μήνες", "12+ months");
  return pickLocale(locale, `${value} μήνες`, `${value} months`);
}

export function longTermDurationLabel(value: number, locale?: string): string {
  if (value === 0) return pickLocale(locale, "Κατόπιν συνεννόησης", "By arrangement");
  return pickLocale(locale, "12+ μήνες", "12+ months");
}