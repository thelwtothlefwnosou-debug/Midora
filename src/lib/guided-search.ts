import type { DateRangeValue } from "@/components/availability/InterestDateRangePicker";
import type { GuestCounts } from "@/components/search/GuestPicker";
import { guestCountsToSearchTotal } from "@/components/search/GuestPicker";

export type ActiveSearchField = "location" | "dates" | "guests" | null;

export const SEARCH_DATE_ANYTIME_LABEL = "Οποιαδήποτε στιγμή";
export const SEARCH_GUESTS_LABEL = "Επισκέπτες";
export const PARTIAL_DATE_RANGE_HINT =
  "Επίλεξε ημερομηνία αναχώρησης ή καθάρισε τις ημερομηνίες.";

export function isCompleteDateRange(range: DateRangeValue): boolean {
  if (!range?.start || !range.end) return false;
  return range.start !== range.end;
}

export function getPartialDateRangeMessage(
  from?: string | null,
  to?: string | null
): string | null {
  const start = from?.trim() ?? "";
  const end = to?.trim() ?? "";
  if (!start && !end) return null;
  if (start && end && start !== end) return null;
  return PARTIAL_DATE_RANGE_HINT;
}

export function formatCompactSearchDateRange(start: string, end: string): string {
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);
  const monthFmt = new Intl.DateTimeFormat("el-GR", { month: "short" });
  const m1Label = monthFmt.format(new Date(y1, m1 - 1, 1)).replace(/\.$/, "");
  const m2Label = monthFmt.format(new Date(y2, m2 - 1, 1)).replace(/\.$/, "");

  if (y1 === y2 && m1 === m2) {
    return `${d1}–${d2} ${m1Label}`;
  }
  if (y1 === y2) {
    return `${d1} ${m1Label} – ${d2} ${m2Label}`;
  }
  return `${d1} ${m1Label} ${y1} – ${d2} ${m2Label} ${y2}`;
}

export function formatSearchDateLabel(range: DateRangeValue): string {
  if (!isCompleteDateRange(range)) return SEARCH_DATE_ANYTIME_LABEL;
  return formatCompactSearchDateRange(range!.start, range!.end);
}

export function formatGuestSearchLabel(
  counts: GuestCounts | null,
  hasSelection: boolean
): string {
  if (!hasSelection || !counts) return SEARCH_GUESTS_LABEL;
  const total = guestCountsToSearchTotal(counts);
  if (total <= 0) return SEARCH_GUESTS_LABEL;
  return total === 1 ? "1 επισκέπτης" : `${total} επισκέπτες`;
}

export function guestCountsToParam(
  counts: GuestCounts | null,
  hasSelection: boolean
): string {
  if (!hasSelection || !counts) return "";
  const total = guestCountsToSearchTotal(counts);
  return total > 0 ? String(total) : "";
}
