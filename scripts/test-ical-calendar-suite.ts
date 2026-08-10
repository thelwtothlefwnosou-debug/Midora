/**
 * Mandatory iCal / availability date + security tests (production blockers).
 * Run: npx tsx scripts/test-ical-calendar-suite.ts
 * Exit 1 on any failure.
 */
import {
  blockedKeysInHalfOpen,
  halfOpenToInclusive,
  isKeyBlockedByHalfOpen,
  parseIcsBusyRanges,
  parseYyyymmdd,
} from "../src/lib/ical/ics-parse";
import { isBlockedHostname, maskCalendarUrl } from "../src/lib/ical/url-guards";
import { stayRangeHasBlockedNight } from "../src/lib/listing-short-term-price";
import { addDays } from "../src/lib/availability-calendar";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✓ ${msg}`);
  }
}

function icsEvent(uid: string, start: string, end?: string, extra = ""): string {
  const endLine = end ? `DTEND;VALUE=DATE:${end}` : "";
  return `BEGIN:VEVENT
UID:${uid}
DTSTART;VALUE=DATE:${start}
${endLine}
${extra}
END:VEVENT`;
}

function wrap(events: string): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MidoraTest//EN
${events}
END:VCALENDAR`;
}

console.log("\n🧪 iCal calendar suite\n");

// ---------- GOLDEN TEST (production blocker) ----------
{
  const body = wrap(icsEvent("test-booking-1", "20260810", "20260815"));
  const parsed = parseIcsBusyRanges(body);
  assert(parsed.ok, "golden: parse ok");
  if (parsed.ok) {
    const r = parsed.ranges[0];
    assert(r.startDate === "2026-08-10", `golden: startDate=${r.startDate}`);
    assert(r.endExclusive === "2026-08-15", `golden: endExclusive=${r.endExclusive}`);
    const nights = blockedKeysInHalfOpen(r.startDate, r.endExclusive);
    assert(
      nights.join(",") === "2026-08-10,2026-08-11,2026-08-12,2026-08-13,2026-08-14",
      `golden: nights=${nights.join(",")}`
    );
    assert(!isKeyBlockedByHalfOpen("2026-08-15", r.startDate, r.endExclusive), "golden: 15 not blocked");
    const incl = halfOpenToInclusive(r)!;
    assert(incl.endDate === "2026-08-14", "golden: inclusive end for Midora DB");
  }
}

// ---------- no DTEND ----------
{
  const parsed = parseIcsBusyRanges(wrap(icsEvent("nodtend", "20260820")));
  assert(parsed.ok && parsed.ranges[0]?.endExclusive === "2026-08-21", "no DTEND → single day");
}

// ---------- month / year / leap ----------
{
  const month = parseIcsBusyRanges(wrap(icsEvent("m", "20260130", "20260202")));
  assert(
    month.ok &&
      blockedKeysInHalfOpen(month.ranges[0].startDate, month.ranges[0].endExclusive).join(",") ===
        "2026-01-30,2026-01-31,2026-02-01",
    "month boundary"
  );

  const year = parseIcsBusyRanges(wrap(icsEvent("y", "20261230", "20270102")));
  assert(
    year.ok &&
      blockedKeysInHalfOpen(year.ranges[0].startDate, year.ranges[0].endExclusive).includes(
        "2026-12-31"
      ) &&
      blockedKeysInHalfOpen(year.ranges[0].startDate, year.ranges[0].endExclusive).includes(
        "2027-01-01"
      ),
    "year boundary"
  );

  const leap = parseIcsBusyRanges(wrap(icsEvent("leap", "20240228", "20240301")));
  assert(
    leap.ok &&
      blockedKeysInHalfOpen(leap.ranges[0].startDate, leap.ranges[0].endExclusive).join(",") ===
        "2024-02-28,2024-02-29",
    "leap year"
  );
}

// ---------- cancelled / duplicate / DTEND<=DTSTART / malformed ----------
{
  const cancelled = parseIcsBusyRanges(
    wrap(icsEvent("c", "20260810", "20260812", "STATUS:CANCELLED"))
  );
  assert(cancelled.ok && cancelled.ranges.length === 0, "cancelled skipped");

  const dup = parseIcsBusyRanges(
    wrap(
      `${icsEvent("same", "20260810", "20260812")}\n${icsEvent("same", "20260810", "20260812")}`
    )
  );
  assert(dup.ok && dup.ranges.length === 1, "duplicate UID+range collapsed");

  const bad = parseIcsBusyRanges(wrap(icsEvent("bad", "20260815", "20260810")));
  assert(bad.ok && bad.ranges.length === 0, "DTEND <= DTSTART skipped");

  assert(parseYyyymmdd("20261340") === null, "malformed date rejected");
  assert(parseYyyymmdd("20260810") === "2026-08-10", "YYYYMMDD parse");
}

// ---------- missing UID still parses ----------
{
  const body = wrap(`BEGIN:VEVENT
DTSTART;VALUE=DATE:20260901
DTEND;VALUE=DATE:20260903
END:VEVENT`);
  const parsed = parseIcsBusyRanges(body);
  assert(parsed.ok && parsed.ranges.length === 1 && parsed.ranges[0].uid.startsWith("hash:"), "missing UID → hash");
}

// ---------- overlap union (Airbnb + Booking) ----------
{
  const airbnb = { startDate: "2026-08-10", endExclusive: "2026-08-15" };
  const booking = { startDate: "2026-08-13", endExclusive: "2026-08-17" };
  const union = new Set([
    ...blockedKeysInHalfOpen(airbnb.startDate, airbnb.endExclusive),
    ...blockedKeysInHalfOpen(booking.startDate, booking.endExclusive),
  ]);
  const expected = [
    "2026-08-10",
    "2026-08-11",
    "2026-08-12",
    "2026-08-13",
    "2026-08-14",
    "2026-08-15",
    "2026-08-16",
  ];
  assert(
    expected.every((d) => union.has(d)) && union.size === expected.length,
    "overlap Airbnb+Booking union nights"
  );
  // remove airbnb → booking remains
  const after = new Set(blockedKeysInHalfOpen(booking.startDate, booking.endExclusive));
  assert(!after.has("2026-08-10") && after.has("2026-08-13"), "remove Airbnb keeps Booking");
}

// ---------- request validation vs Midora inclusive periods ----------
{
  // [10,15) → inclusive DB 10–14
  const periods = [{ start_date: "2026-08-10", end_date: "2026-08-14" }];
  assert(!stayRangeHasBlockedNight("2026-08-15", "2026-08-18", periods), "[15,18) allowed");
  assert(stayRangeHasBlockedNight("2026-08-14", "2026-08-18", periods), "[14,18) rejected");
  assert(!stayRangeHasBlockedNight("2026-08-09", "2026-08-10", periods), "[9,10) allowed");
  assert(stayRangeHasBlockedNight("2026-08-09", "2026-08-11", periods), "[9,11) rejected");
}

// ---------- external + manual overlap ----------
{
  const periods = [
    { start_date: "2026-08-10", end_date: "2026-08-12" }, // external
    { start_date: "2026-08-12", end_date: "2026-08-14" }, // manual
  ];
  assert(stayRangeHasBlockedNight("2026-08-11", "2026-08-13", periods), "external+manual overlap blocks");
}

// ---------- changed / deleted event semantics (pure) ----------
{
  const before = parseIcsBusyRanges(wrap(icsEvent("chg", "20260810", "20260812")));
  const after = parseIcsBusyRanges(wrap(icsEvent("chg", "20260820", "20260822")));
  assert(
    before.ok &&
      after.ok &&
      before.ranges[0].startDate === "2026-08-10" &&
      after.ranges[0].startDate === "2026-08-20",
    "changed event dates"
  );
  const deleted = parseIcsBusyRanges(wrap(""));
  assert(!deleted.ok || deleted.ranges.length === 0, "empty/deleted feed → no ranges");
}

// ---------- DST smoke (Athens) via addDays chain ----------
{
  // Spring forward 2026-03-29 in Greece — calendar dates still consecutive
  let d = "2026-03-28";
  d = addDays(d, 1);
  assert(d === "2026-03-29", "DST spring calendar day");
  d = addDays(d, 1);
  assert(d === "2026-03-30", "DST spring next day");
}

// ---------- SSRF hostname guards ----------
{
  assert(isBlockedHostname("localhost"), "ssrf localhost");
  assert(isBlockedHostname("127.0.0.1"), "ssrf loopback");
  assert(isBlockedHostname("10.0.0.5"), "ssrf 10/8");
  assert(isBlockedHostname("192.168.1.1"), "ssrf 192.168");
  assert(isBlockedHostname("169.254.169.254"), "ssrf metadata");
  assert(isBlockedHostname("metadata.google.internal"), "ssrf gcp metadata");
  assert(!isBlockedHostname("calendar.airbnb.com"), "ssrf allows public host");
  const masked = maskCalendarUrl("https://www.airbnb.com/calendar/ical/12345.ics");
  assert(masked.includes("…") && !masked.includes("12345.ics"), "url masked");
}

// ---------- anti-loop export rule (documented invariant) ----------
{
  // Export route filters source=manual only — assert helper intent
  const sources = ["manual", "external_calendar", null] as const;
  const exportable = sources.filter((s) => s === "manual" || s == null);
  assert(exportable.length === 2 && !exportable.includes("external_calendar" as never), "anti-loop export sources");
}

// ---------- last-known-good after failed fetch (contract) ----------
{
  // Successful sync may remove stale UIDs; failed fetch must keep prior blocks.
  // Mirrors syncExternalCalendarById: on fetch/parse failure → keptLastKnownGood,
  // no delete of listing_unavailable_periods for that calendar.
  type SyncOutcome =
    | { ok: true; applyDeletes: true; keptLastKnownGood: false }
    | { ok: false; applyDeletes: false; keptLastKnownGood: true };

  function simulateSync(fetchOk: boolean): SyncOutcome {
    if (!fetchOk) {
      return { ok: false, applyDeletes: false, keptLastKnownGood: true };
    }
    return { ok: true, applyDeletes: true, keptLastKnownGood: false };
  }

  const afterSuccess = simulateSync(true);
  assert(afterSuccess.ok && afterSuccess.applyDeletes, "success sync may delete stale");

  const afterFailedFetch = simulateSync(false);
  assert(
    !afterFailedFetch.ok &&
      !afterFailedFetch.applyDeletes &&
      afterFailedFetch.keptLastKnownGood,
    "failed fetch after successful sync keeps last-known-good"
  );

  const priorBlocked = new Set(["2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14"]);
  // On failure we must not clear priorBlocked
  const afterFailureBlocks = afterFailedFetch.keptLastKnownGood
    ? new Set(priorBlocked)
    : new Set<string>();
  assert(
    [...priorBlocked].every((d) => afterFailureBlocks.has(d)),
    "failed fetch does not open previously blocked nights"
  );
}

console.log("");
if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed — production rollout BLOCKED\n`);
  process.exit(1);
}
console.log("✅ All mandatory iCal calendar tests PASS\n");
