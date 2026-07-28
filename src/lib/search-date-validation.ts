import type { ListingFilters } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";
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
  messageKeys: string[];
};

export function sanitizeSearchDateFilters(
  filters: ListingFilters,
  locale?: string
): SearchDateSanitizeResult {
  const messages: string[] = [];
  const messageKeys: string[] = [];
  const next = { ...filters };
  const today = getTodayInAthens();
  const currentMonth = getCurrentMonthInAthens();
  const datesPastMsg = pickLocale(
    locale,
    "Οι επιλεγμένες ημερομηνίες έχουν περάσει. Διάλεξε νέα περίοδο.",
    "The selected dates have passed. Choose a new period."
  );
  const monthPastMsg = pickLocale(
    locale,
    "Ο επιλεγμένος μήνας έχει περάσει. Διάλεξε νέο μήνα έναρξης.",
    "The selected month has passed. Choose a new start month."
  );

  if (next.interestFrom && isPastDateInAthens(next.interestFrom)) {
    delete next.interestFrom;
    messages.push(datesPastMsg);
    messageKeys.push("datesPassed");
  }
  if (next.interestTo && isPastDateInAthens(next.interestTo)) {
    delete next.interestTo;
    if (!messages.length) {
      messages.push(datesPastMsg);
      messageKeys.push("datesPassed");
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
    messages.push(monthPastMsg);
    messageKeys.push("monthPassed");
  }

  if (next.interestDurationMonths != null && next.interestDurationMonths < 2) {
    next.interestDurationMonths = 2;
  }

  if (!next.interestFrom && !next.interestTo && messageKeys.includes("datesPassed")) {
    void today;
  }
  if (!next.interestStartMonth && messageKeys.includes("monthPassed")) {
    void currentMonth;
  }

  return { filters: next, messages: [...new Set(messages)], messageKeys: [...new Set(messageKeys)] };
}

export function validateShortTermDateInput(
  from: string,
  to: string,
  locale?: string
): string | null {
  const today = getTodayInAthens();
  if (from && isPastDateInAthens(from)) {
    return pickLocale(
      locale,
      "Η ημερομηνία «Από» δεν μπορεί να είναι στο παρελθόν.",
      "The “From” date cannot be in the past."
    );
  }
  if (to && isPastDateInAthens(to)) {
    return pickLocale(
      locale,
      "Η ημερομηνία «Έως» δεν μπορεί να είναι στο παρελθόν.",
      "The “To” date cannot be in the past."
    );
  }
  if (from && to && compareDateKeys(to, from) < 0) {
    return pickLocale(
      locale,
      "Η ημερομηνία «Έως» πρέπει να είναι μετά την «Από».",
      "The “To” date must be after “From”."
    );
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
