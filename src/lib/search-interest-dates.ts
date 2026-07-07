import type { ListingFilters } from "@/lib/types";
import { toDateKey } from "@/lib/availability-calendar";

export const MID_TERM_DURATION_OPTIONS = [
  { value: 2, label: "2 μήνες" },
  { value: 3, label: "3 μήνες" },
  { value: 6, label: "6 μήνες" },
  { value: 9, label: "9 μήνες" },
  { value: 12, label: "12+ μήνες" },
] as const;

export const LONG_TERM_DURATION_OPTIONS = [
  { value: 12, label: "12+ μήνες" },
  { value: 0, label: "Κατόπιν συνεννόησης" },
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

export function formatInterestRangeLabel(from: string, to: string): string {
  const fmt = new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(new Date(from))} – ${fmt.format(new Date(to))}`;
}

export function formatMonthLabel(yyyyMm: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!match) return yyyyMm;
  const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1);
  return new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric" }).format(d);
}
