import ical, { type CalendarComponent, type VEvent } from "node-ical";
import { addDays } from "@/lib/availability-calendar";
import { createHash } from "node:crypto";

/**
 * Canonical busy interval: half-open [startDate, endExclusive).
 * DTSTART inclusive, DTEND exclusive (RFC 5545 all-day).
 */
export type HalfOpenBusyRange = {
  startDate: string;
  endExclusive: string;
  uid: string;
  summary?: string;
};

/** Midora DB stores inclusive end_date (last blocked calendar night/day). */
export type InclusiveBusyRange = {
  startDate: string;
  endDate: string;
  uid: string;
  summary?: string;
};

export type ParseIcsResult =
  | { ok: true; ranges: HalfOpenBusyRange[] }
  | { ok: false; error: "empty" | "invalid" | "no_calendar" };

function isVEvent(comp: CalendarComponent): comp is VEvent {
  return comp.type === "VEVENT";
}

/** YYYY-MM-DD from floating/date-only Date (node-ical local calendar components). */
function floatingDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse bare YYYYMMDD without Date() timezone round-trips. */
export function parseYyyymmdd(raw: string): string | null {
  const compact = raw.trim();
  const m = compact.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const probe = new Date(y, mo - 1, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== mo - 1 || probe.getDate() !== d) {
    return null;
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function athensDateKeyFromDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function halfOpenToInclusive(range: HalfOpenBusyRange): InclusiveBusyRange | null {
  if (range.endExclusive <= range.startDate) return null;
  return {
    startDate: range.startDate,
    endDate: addDays(range.endExclusive, -1),
    uid: range.uid,
    summary: range.summary,
  };
}

/** Nights/days blocked by [start, endExclusive). */
export function blockedKeysInHalfOpen(startDate: string, endExclusive: string): string[] {
  const out: string[] = [];
  if (!startDate || !endExclusive || endExclusive <= startDate) return out;
  let key = startDate;
  while (key < endExclusive) {
    out.push(key);
    key = addDays(key, 1);
  }
  return out;
}

export function isKeyBlockedByHalfOpen(
  dateKey: string,
  startDate: string,
  endExclusive: string
): boolean {
  return dateKey >= startDate && dateKey < endExclusive;
}

/**
 * Convert VEVENT → half-open [start, endExclusive).
 * All-day: floating Y-M-D, no UTC round-trip.
 * Date-time: Europe/Athens calendar dates; midnight end is exclusive.
 */
export function veventToHalfOpen(event: VEvent): HalfOpenBusyRange | null {
  if (event.status && String(event.status).toUpperCase() === "CANCELLED") {
    return null;
  }

  const start = event.start;
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null;

  const startAny = start as Date & { dateOnly?: boolean };
  const allDay =
    Boolean((event as VEvent & { datetype?: string }).datetype === "date") ||
    Boolean(startAny.dateOnly);

  let startDate: string;
  let endExclusive: string;

  if (allDay) {
    startDate = floatingDateKey(start);
    if (event.end instanceof Date && !Number.isNaN(event.end.getTime())) {
      endExclusive = floatingDateKey(event.end);
    } else {
      // No DTEND → single day [start, start+1)
      endExclusive = addDays(startDate, 1);
    }
  } else {
    startDate = athensDateKeyFromDate(start);
    if (event.end instanceof Date && !Number.isNaN(event.end.getTime())) {
      const endKey = athensDateKeyFromDate(event.end);
      const endAthensParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Athens",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(event.end);
      const hour = Number(endAthensParts.find((p) => p.type === "hour")?.value ?? "0");
      const minute = Number(endAthensParts.find((p) => p.type === "minute")?.value ?? "0");
      const second = Number(endAthensParts.find((p) => p.type === "second")?.value ?? "0");
      const endsMidnight = hour === 0 && minute === 0 && second === 0;
      // Timed end is exclusive at that instant; midnight → that calendar day is exclusive
      endExclusive = endsMidnight ? endKey : addDays(endKey, 1);
    } else {
      endExclusive = addDays(startDate, 1);
    }
  }

  if (!startDate || !endExclusive) return null;
  if (endExclusive <= startDate) return null;

  const uidRaw =
    typeof event.uid === "string" && event.uid.trim()
      ? event.uid.trim()
      : `hash:${createHash("sha256")
          .update(`${startDate}|${endExclusive}|${event.summary ?? ""}`)
          .digest("hex")
          .slice(0, 32)}`;

  return {
    startDate,
    endExclusive,
    uid: uidRaw.slice(0, 500),
    summary: typeof event.summary === "string" ? event.summary.slice(0, 200) : undefined,
  };
}

/** @deprecated use veventToHalfOpen + halfOpenToInclusive */
export function veventToInclusiveRange(event: VEvent): InclusiveBusyRange | null {
  const half = veventToHalfOpen(event);
  if (!half) return null;
  return halfOpenToInclusive(half);
}

export function parseIcsBusyRanges(icsBody: string): ParseIcsResult {
  const trimmed = icsBody.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (!/BEGIN:VCALENDAR/i.test(trimmed)) return { ok: false, error: "no_calendar" };

  let parsed: ReturnType<typeof ical.sync.parseICS>;
  try {
    parsed = ical.sync.parseICS(trimmed);
  } catch {
    return { ok: false, error: "invalid" };
  }

  const ranges: HalfOpenBusyRange[] = [];
  const seen = new Set<string>();

  for (const value of Object.values(parsed)) {
    if (!value || !isVEvent(value)) continue;
    const range = veventToHalfOpen(value);
    if (!range) continue;
    const dedupeKey = `${range.uid}|${range.startDate}|${range.endExclusive}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    ranges.push(range);
  }

  return { ok: true, ranges };
}

export function looksLikeIcs(body: string): boolean {
  const sample = body.slice(0, 4000);
  return /BEGIN:VCALENDAR/i.test(sample) && /BEGIN:VEVENT|END:VCALENDAR/i.test(sample);
}
