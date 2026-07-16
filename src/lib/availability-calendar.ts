import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { getTodayInAthens } from "@/lib/dates-athens";

export const WEEKDAY_LABELS = ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"] as const;

const MONTH_NAMES = [
  "Ιανουάριος",
  "Φεβρουάριος",
  "Μάρτιος",
  "Απρίλιος",
  "Μάιος",
  "Ιούνιος",
  "Ιούλιος",
  "Αύγουστος",
  "Σεπτέμβριος",
  "Οκτώβριος",
  "Νοέμβριος",
  "Δεκέμβριος",
] as const;

export type CalendarDay = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
};

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function getCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);

  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const days: CalendarDay[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(year, monthIndex, -i);
    days.push({ date, dateKey: toDateKey(date), inMonth: false });
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, monthIndex, d);
    days.push({ date, dateKey: toDateKey(date), inMonth: true });
  }

  while (days.length % 7 !== 0) {
    const prev = days[days.length - 1].date;
    const date = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
    days.push({ date, dateKey: toDateKey(date), inMonth: false });
  }

  while (days.length < 42) {
    const prev = days[days.length - 1].date;
    const date = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
    days.push({ date, dateKey: toDateKey(date), inMonth: false });
  }

  return days;
}

export function isDateUnavailable(
  dateKey: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[]
): boolean {
  return periods.some((p) => dateKey >= p.start_date && dateKey <= p.end_date);
}

export function normalizeDateRange(
  a: string,
  b: string
): { start: string; end: string } {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export type SelectionRole = "start" | "end" | "middle" | false;

export function getSelectionRole(
  dateKey: string,
  selectionStart?: string | null,
  selectionEnd?: string | null
): SelectionRole {
  if (!selectionStart) return false;
  if (!selectionEnd) {
    return dateKey === selectionStart ? "start" : false;
  }
  const { start, end } = normalizeDateRange(selectionStart, selectionEnd);
  if (dateKey === start) return "start";
  if (dateKey === end) return "end";
  if (dateKey > start && dateKey < end) return "middle";
  return false;
}

export function isToday(dateKey: string): boolean {
  return dateKey === getTodayInAthens();
}

export function todayDateKey(): string {
  return getTodayInAthens();
}

export function isPastDate(dateKey: string): boolean {
  return dateKey < getTodayInAthens();
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return toDateKey(date);
}

export function periodDurationDays(startDate: string, endDate: string): number {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const startMs = new Date(ys, ms - 1, ds).getTime();
  const endMs = new Date(ye, me - 1, de).getTime();
  const diff = Math.round((endMs - startMs) / 86400000);
  return diff + 1;
}

/** Nights between check-in and check-out (checkout day is exclusive). */
export function stayNightsBetween(startDate: string, endDate: string): number {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const startMs = new Date(ys, ms - 1, ds).getTime();
  const endMs = new Date(ye, me - 1, de).getTime();
  const diff = Math.round((endMs - startMs) / 86400000);
  return Math.max(0, diff);
}

export function getFullMonthRange(month: Date): { start: string; end: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

/** Owner dashboard helpers — not used in public search/listing pickers */
export function getUpcomingWeekendRange(from = new Date()): { start: string; end: string } {
  const day = from.getDay();
  const daysUntilSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
  const sat = new Date(from.getFullYear(), from.getMonth(), from.getDate() + daysUntilSat);
  const sun = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 1);
  return { start: toDateKey(sat), end: toDateKey(sun) };
}

export function getNextWeekendRange(from = new Date()): { start: string; end: string } {
  const afterThis = addDays(getUpcomingWeekendRange(from).end, 1);
  const [y, m, d] = afterThis.split("-").map(Number);
  return getUpcomingWeekendRange(new Date(y, m - 1, d));
}

export function getRangeFromToday(days: number): { start: string; end: string } {
  const start = todayDateKey();
  return { start, end: addDays(start, days - 1) };
}

export function formatDateKeyDisplay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function isDateSelectable(
  dateKey: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = []
): boolean {
  return !isPastDate(dateKey) && !isDateUnavailable(dateKey, periods);
}

export function hasUnavailableInRange(
  startDate: string,
  endDate: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = []
): boolean {
  const { start, end } = normalizeDateRange(startDate, endDate);
  let key = start;
  while (key <= end) {
    if (isDateUnavailable(key, periods)) return true;
    key = addDays(key, 1);
  }
  return false;
}

export function isRangeSelectable(
  startDate: string,
  endDate: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = []
): boolean {
  if (!startDate || !endDate) return false;
  if (isPastDate(startDate) || isPastDate(endDate)) return false;
  return !hasUnavailableInRange(startDate, endDate, periods);
}

export function meetsMinimumStayNights(
  startDate: string,
  endDate: string,
  minimumStayNights: number
): boolean {
  if (minimumStayNights <= 1) return true;
  return stayNightsBetween(startDate, endDate) >= minimumStayNights;
}

/** True when selecting end date before minimum stay from start is satisfied. */
export function isBeforeMinimumStayEnd(
  startDate: string,
  endDate: string,
  minimumStayNights: number
): boolean {
  if (!startDate || !endDate || minimumStayNights <= 1) return false;
  const { start, end } = normalizeDateRange(startDate, endDate);
  if (end <= start) return false;
  return stayNightsBetween(start, end) < minimumStayNights;
}

export function getDateDisabledReason(
  dateKey: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = []
): "past" | "unavailable" | null {
  if (isPastDate(dateKey)) return "past";
  if (isDateUnavailable(dateKey, periods)) return "unavailable";
  return null;
}
