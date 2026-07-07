import { NextResponse } from "next/server";
import { geocodeCityCenter } from "@/lib/geocoding/nominatim";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "geocode-city", 60, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() ?? "";

  if (name.length < 2) {
    return NextResponse.json({ result: null });
  }

  const result = await geocodeCityCenter(name);
  return NextResponse.json({ result });
}
