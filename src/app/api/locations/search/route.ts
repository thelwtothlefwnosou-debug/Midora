import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import {
  searchGreekLocations,
  resolveLocation,
  searchWizardAreas,
  searchWizardCities,
  searchWizardCitiesOnly,
  searchWizardAreaSuggestions,
  MIN_LOCATION_QUERY_LENGTH,
  MAX_LOCATION_SUGGESTIONS,
} from "@/lib/locations/search-server";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/api/rate-limit-response";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "locations-search", 120, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const scope = searchParams.get("scope") ?? "all";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? String(MAX_LOCATION_SUGGESTIONS), 10) ||
      MAX_LOCATION_SUGGESTIONS,
    20
  );

  if (query.trim().length > 0 && query.trim().length < MIN_LOCATION_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [], resolved: null });
  }

  try {
    if (scope === "areas" && city.trim()) {
      const suggestions = searchWizardAreaSuggestions(city, query, limit);
      return NextResponse.json({ suggestions, resolved: null });
    }

    if (scope === "cities") {
      const suggestions = searchWizardCitiesOnly(query, limit);
      const resolved = query.trim() ? resolveLocation(query) : null;
      return NextResponse.json({ suggestions, resolved });
    }

    if (city.trim()) {
      const areas = searchWizardAreas(city, query, limit);
      const suggestions = areas.map((area) => ({
        label: `${area} · ${city}`,
        city,
        area,
        kind: "area" as const,
        rank: 50,
        aliases: [],
      }));
      return NextResponse.json({ suggestions, resolved: null });
    }

    const suggestions = searchGreekLocations(query, limit);
    const resolved = query.trim() ? resolveLocation(query) : null;

    return NextResponse.json({
      suggestions,
      resolved,
    });
  } catch {
    const t = await getTranslations("Errors");
    return NextResponse.json(
      { error: t("locationsSearchFailed") },
      { status: 500 }
    );
  }
}
