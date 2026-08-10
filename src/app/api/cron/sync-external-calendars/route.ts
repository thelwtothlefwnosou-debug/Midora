import { NextResponse } from "next/server";
import { cronSyncDueExternalCalendars } from "@/lib/ical/external-calendar-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await cronSyncDueExternalCalendars(25);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
