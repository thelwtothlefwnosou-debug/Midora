import type { ListingFilters } from "@/lib/types";
import {
  compareDateKeys,
  getCurrentMonthInAthens,
  getTodayInAthens,
  isPastDateInAthens,
  isPastMonthInAthens,
} from "@/lib/dates-athens";

export type SearchDateSanitizeResult = {
  filters: ListingFilters;
  messages: string[];
};

export function sanitizeSearchDateFilters(
  filters: ListingFilters
): SearchDateSanitizeResult {
  const messages: string[] = [];
  const next = { ...filters };
  const today = getTodayInAthens();
  const currentMonth = getCurrentMonthInAthens();

  if (next.interestFrom && isPastDateInAthens(next.interestFrom)) {
    delete next.interestFrom;
    messages.push("Οι επιλεγμένες ημερομηνίες έχουν περάσει. Διάλεξε νέα περίοδο.");
  }
  if (next.interestTo && isPastDateInAthens(next.interestTo)) {
    delete next.interestTo;
    if (!messages.length) {
      messages.push("Οι επιλεγμένες ημερομηνίες έχουν περάσει. Διάλεξε νέα περίοδο.");
    }
  }
  if (
    next.interestFrom &&
    next.interestTo &&
    compareDateKeys(next.interestTo, next.interestFrom) < 0
  ) {
    delete next.interestTo;
  }

  if (next.interestStartMonth && isPastMonthInAthens(next.interestStartMonth)) {
    delete next.interestStartMonth;
    messages.push("Ο επιλεγμένος μήνας έχει περάσει. Διάλεξε νέο μήνα έναρξης.");
  }

  if (next.interestDurationMonths != null && next.interestDurationMonths < 2) {
    next.interestDurationMonths = 2;
  }

  if (!next.interestFrom && !next.interestTo && messages.some((m) => m.includes("ημερομηνίες"))) {
    void today;
  }
  if (!next.interestStartMonth && messages.some((m) => m.includes("μήνας"))) {
    void currentMonth;
  }

  return { filters: next, messages: [...new Set(messages)] };
}

export function validateShortTermDateInput(from: string, to: string): string | null {
  const today = getTodayInAthens();
  if (from && isPastDateInAthens(from)) return "Η ημερομηνία «Από» δεν μπορεί να είναι στο παρελθόν.";
  if (to && isPastDateInAthens(to)) return "Η ημερομηνία «Έως» δεν μπορεί να είναι στο παρελθόν.";
  if (from && to && compareDateKeys(to, from) < 0) {
    return "Η ημερομηνία «Έως» πρέπει να είναι μετά την «Από».";
  }
  if (!from && !to) return null;
  void today;
  return null;
}

export function minSearchDateValue(): string {
  return getTodayInAthens();
}

export function minSearchMonthValue(): string {
  return getCurrentMonthInAthens();
}
