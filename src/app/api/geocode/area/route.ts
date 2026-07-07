import { NextResponse } from "next/server";
import { geocodeAreaCenter } from "@/lib/geocoding/nominatim";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "geocode-area", 60, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() ?? "";
  const area = searchParams.get("area")?.trim() ?? "";

  if (city.length < 2 || area.length < 2) {
    return NextResponse.json({ lat: null, lng: null });
  }

  const center = await geocodeAreaCenter(area, city);
  if (!center) {
    return NextResponse.json({ lat: null, lng: null });
  }

  return NextResponse.json({ lat: center.lat, lng: center.lng });
}
