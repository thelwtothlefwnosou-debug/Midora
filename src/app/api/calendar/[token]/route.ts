import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsDate(dateKey: string): string {
  return dateKey.replace(/-/g, "");
}

/** Exclusive end for all-day ICS = inclusive Midora end + 1 day. */
function exclusiveEnd(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/**
 * Public Midora ICS export (token-gated).
 * Anti-loop: only source = manual (or null/legacy) unavailable periods.
 * Never includes external_calendar imports.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await context.params;
  const token = rawToken.replace(/\.ics$/i, "").trim();
  if (!token || token.length < 20) {
    return new NextResponse("Not found", { status: 404 });
  }

  const service = createServiceClient();
  if (!service) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const { data: feed } = await service
    .from("listing_calendar_export_feeds")
    .select("listing_id, enabled")
    .eq("token", token)
    .eq("enabled", true)
    .maybeSingle();

  if (!feed?.listing_id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: listing } = await service
    .from("listings")
    .select("id, rental_type, title")
    .eq("id", feed.listing_id)
    .maybeSingle();

  if (!listing || listing.rental_type !== "short_term") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: periods } = await service
    .from("listing_unavailable_periods")
    .select("id, start_date, end_date, source")
    .eq("listing_id", listing.id)
    .or("source.eq.manual,source.is.null");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Midora//Availability//EL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape("Midora — Μη διαθέσιμο")}`,
  ];

  for (const period of periods ?? []) {
    if (period.source && period.source !== "manual") continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:midora-manual-${period.id}@midora`);
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(period.start_date)}`);
    lines.push(`DTEND;VALUE=DATE:${exclusiveEnd(period.end_date)}`);
    lines.push(`SUMMARY:${icsEscape("Μη διαθέσιμο")}`);
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(`${lines.join("\r\n")}\r\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
