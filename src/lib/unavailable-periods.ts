export type UnavailablePeriodReason =
  | "personal_use"
  | "maintenance"
  | "unavailable"
  | "other";

export type ListingUnavailablePeriod = {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  reason: UnavailablePeriodReason | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export const UNAVAILABLE_PERIOD_REASONS: {
  value: UnavailablePeriodReason;
  label: string;
}[] = [
  { value: "personal_use", label: "Προσωπική χρήση" },
  { value: "maintenance", label: "Συντήρηση" },
  { value: "unavailable", label: "Ήδη μη διαθέσιμο" },
  { value: "other", label: "Άλλο" },
];

export function unavailableReasonLabel(
  reason: UnavailablePeriodReason | string | null | undefined
): string {
  const found = UNAVAILABLE_PERIOD_REASONS.find((r) => r.value === reason);
  return found?.label ?? "Μη διαθέσιμο";
}

export function formatUnavailablePeriodRange(
  startDate: string,
  endDate: string
): string {
  const fmt = new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(new Date(startDate))} – ${fmt.format(new Date(endDate))}`;
}

export function periodsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function findOverlappingPeriod(
  periods: Pick<ListingUnavailablePeriod, "id" | "start_date" | "end_date">[],
  startDate: string,
  endDate: string,
  excludeId?: string
): Pick<ListingUnavailablePeriod, "id" | "start_date" | "end_date"> | null {
  for (const p of periods) {
    if (excludeId && p.id === excludeId) continue;
    if (periodsOverlap(startDate, endDate, p.start_date, p.end_date)) {
      return p;
    }
  }
  return null;
}

export function findAllOverlappingPeriods(
  periods: Pick<ListingUnavailablePeriod, "id" | "start_date" | "end_date">[],
  startDate: string,
  endDate: string,
  excludeId?: string
): Pick<ListingUnavailablePeriod, "id" | "start_date" | "end_date">[] {
  return periods.filter((p) => {
    if (excludeId && p.id === excludeId) return false;
    return periodsOverlap(startDate, endDate, p.start_date, p.end_date);
  });
}

/** Merge a new range with any overlapping periods into one continuous span. */
export function mergeUnavailableRange(
  periods: Pick<ListingUnavailablePeriod, "id" | "start_date" | "end_date">[],
  startDate: string,
  endDate: string,
  excludeId?: string
): { start: string; end: string; mergeIds: string[] } {
  let start = startDate;
  let end = endDate;
  const mergeIds: string[] = [];

  for (const p of periods) {
    if (excludeId && p.id === excludeId) continue;
    if (!periodsOverlap(start, end, p.start_date, p.end_date)) continue;
    start = start < p.start_date ? start : p.start_date;
    end = end > p.end_date ? end : p.end_date;
    mergeIds.push(p.id);
  }

  return { start, end, mergeIds };
}
