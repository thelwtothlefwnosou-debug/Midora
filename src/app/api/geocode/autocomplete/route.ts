import { NextResponse } from "next/server";
import { searchStreetsInCity, searchGreeceAddresses } from "@/lib/geocoding/nominatim";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "geocode-autocomplete", 90, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const area = searchParams.get("area")?.trim() ?? "";
  const postalCode = searchParams.get("postalCode")?.trim() ?? "";
  const streetNumber = searchParams.get("streetNumber")?.trim() ?? "";
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const full = searchParams.get("mode") === "full";
  const center =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;

  if (city) {
    if (q.length < 1) {
      return NextResponse.json({ suggestions: [] });
    }
    const suggestions = await searchStreetsInCity(q, city, 15, {
      postalCode: postalCode || undefined,
      streetNumber: streetNumber || undefined,
      area: area || undefined,
      center,
      fast: !full,
    });
    return NextResponse.json({ suggestions });
  }

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await searchGreeceAddresses(q, 8);
  return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
}
