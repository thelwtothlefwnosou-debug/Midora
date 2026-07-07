import { NextResponse } from "next/server";
import { geocodeAreaCenter, reverseGeocodeGreece } from "@/lib/geocoding/nominatim";
import {
  pinLocationMatchesScope,
  resolveCanonicalCityName,
} from "@/lib/geocoding/geocode-utils";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "geocode-reverse", 60, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const expectedCity = searchParams.get("city")?.trim() ?? "";
  const expectedArea = searchParams.get("area")?.trim() ?? "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const result = await reverseGeocodeGreece(lat, lng);
  if (!result) {
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 404 });
  }

  if (expectedCity) {
    const canonical = resolveCanonicalCityName(expectedCity);
    const areaCenter = expectedArea
      ? await geocodeAreaCenter(expectedArea, canonical)
      : null;
    const matches = pinLocationMatchesScope(
      result,
      canonical,
      { lat, lng },
      expectedArea || undefined,
      areaCenter
    );    return NextResponse.json({
      result,
      matchesCity: matches,
      expectedCity: canonical,
      expectedArea: expectedArea || null,
    });
  }

  return NextResponse.json({ result, matchesCity: true });
}
