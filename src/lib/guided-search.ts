import type { DateRangeValue } from "@/components/availability/InterestDateRangePicker";
import type { GuestCounts, GuestTileLabels } from "@/components/search/GuestPicker";
import {
  formatGuestTileLabel,
  guestCountsToSearchTotal,
  hasGuestOrPetSelection,
} from "@/components/search/GuestPicker";

export type ActiveSearchField =
  | "location"
  | "dates"
  | "checkIn"
  | "checkOut"
  | "guests"
  | null;

export const SEARCH_LOCATION_PLACEHOLDER = "Add destination";
export const SEARCH_DATE_ANYTIME_LABEL = "Anytime";
export const SEARCH_DATE_PLACEHOLDER = "When?";
export const SEARCH_GUESTS_FIELD_LABEL = "Who";
export const SEARCH_GUESTS_EMPTY_LABEL = "Add guests";
/** @deprecated Use SEARCH_GUESTS_FIELD_LABEL / SEARCH_GUESTS_EMPTY_LABEL */
export const SEARCH_GUESTS_LABEL = SEARCH_GUESTS_EMPTY_LABEL;
export const PARTIAL_DATE_RANGE_HINT =
  "Select a check-out date or clear the dates.";

export function isCompleteDateRange(range: DateRangeValue): boolean {
  if (!range?.start || !range.end) return false;
  return range.start !== range.end;
}

export function getPartialDateRangeMessage(
  from?: string | null,
  to?: string | null,
  hint: string = PARTIAL_DATE_RANGE_HINT
): string | null {
  const start = from?.trim() ?? "";
  const end = to?.trim() ?? "";
  if (!start && !end) return null;
  if (start && end && start !== end) return null;
  return hint;
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

function formatSingleSearchDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const monthFmt = new Intl.DateTimeFormat("el-GR", { month: "short" });
  const month = monthFmt.format(new Date(y, m - 1, 1)).replace(/\.$/, "");
  return `${d} ${month}`;
}

export function formatSearchDateLabel(range: DateRangeValue): string {
  if (!isCompleteDateRange(range)) return SEARCH_DATE_ANYTIME_LABEL;
  return formatCompactSearchDateRange(range!.start, range!.end);
}

export function formatSearchCheckInLabel(
  range: DateRangeValue,
  placeholder: string = SEARCH_DATE_PLACEHOLDER
): string {
  const start = range?.start?.trim();
  if (!start) return placeholder;
  return formatSingleSearchDate(start);
}

export function formatSearchCheckOutLabel(
  range: DateRangeValue,
  placeholder: string = SEARCH_DATE_PLACEHOLDER
): string {
  if (!isCompleteDateRange(range)) return placeholder;
  return formatSingleSearchDate(range!.end);
}

export type GuestSearchLabels = GuestTileLabels & { empty: string };

export function formatGuestSearchLabel(
  counts: GuestCounts | null,
  hasSelection: boolean,
  labels?: GuestSearchLabels
): string {
  if (!hasSelection || !counts || !hasGuestOrPetSelection(counts)) {
    return labels?.empty ?? SEARCH_GUESTS_EMPTY_LABEL;
  }
  return formatGuestTileLabel(counts, labels);
}

export function guestCountsToParam(
  counts: GuestCounts | null,
  hasSelection: boolean
): string {
  if (!hasSelection || !counts) return "";
  const total = guestCountsToSearchTotal(counts);
  return total > 0 ? String(total) : "";
}

export function petsCountToParam(
  counts: GuestCounts | null,
  hasSelection: boolean
): string {
  if (!hasSelection || !counts || counts.pets <= 0) return "";
  return String(counts.pets);
}

export function parsePetsSearchParam(raw?: string): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
