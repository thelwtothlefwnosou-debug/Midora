const ATHENS_TZ = "Europe/Athens";

/** YYYY-MM-DD in Europe/Athens */
export function getTodayInAthens(): string {
  return formatAthensDateKey(new Date());
}

/** YYYY-MM in Europe/Athens */
export function getCurrentMonthInAthens(): string {
  const parts = getAthensParts(new Date());
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

function getAthensParts(date: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: ATHENS_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

export function formatAthensDateKey(date: Date): string {
  const { year, month, day } = getAthensParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isPastDateInAthens(dateKey: string): boolean {
  return dateKey < getTodayInAthens();
}

export function isPastMonthInAthens(monthKey: string): boolean {
  return monthKey < getCurrentMonthInAthens();
}

export function compareDateKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
