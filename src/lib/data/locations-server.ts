import "server-only";

import {
  searchGreekLocations,
  resolveLocation as resolveGreekLocation,
  MIN_LOCATION_QUERY_LENGTH,
  MAX_LOCATION_SUGGESTIONS,
} from "@/lib/locations/search-server";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { getAreasForDistrict } from "@/lib/data/greek-areas";
import { citiesMatchNormalized } from "@/lib/locations/search-server";

export type SearchLocationKind = "city" | "district" | "area" | "nearby";

export type SearchLocation = {
  label: string;
  city: string;
  area?: string;
  district?: string;
  region?: string;
  rank: number;
  aliases: string[];
  kind: SearchLocationKind;
};

export { MIN_LOCATION_QUERY_LENGTH, MAX_LOCATION_SUGGESTIONS };

export const normalizeSearchText = normalizeLocationQuery;

export const NEARBY_LOCATION: SearchLocation = {
  label: "Σε κοντινή απόσταση",
  city: "",
  kind: "nearby",
  rank: 0,
  aliases: ["κοντα", "nearby", "gps"],
};

export function getLocationSuggestions(
  query: string,
  limit = MAX_LOCATION_SUGGESTIONS
): SearchLocation[] {
  return searchGreekLocations(query, limit);
}

export function getPopularCities(limit = 6): SearchLocation[] {
  return searchGreekLocations("", limit);
}

export function formatLocationSelection(loc: SearchLocation): string {
  if (loc.kind === "nearby") return loc.label;
  if (loc.area && loc.kind === "area") return loc.area;
  if (loc.district && loc.district !== loc.city && loc.kind === "district") {
    return loc.district;
  }
  return loc.city || loc.label;
}

export function matchesLocation(
  city: string,
  area: string,
  query: string,
  district?: string
): boolean {
  const resolved = resolveGreekLocation(query);
  if (resolved) {
    const cityNorm = normalizeLocationQuery(city);
    const areaNorm = normalizeLocationQuery(area);
    const targetCity = normalizeLocationQuery(resolved.city);
    const targetArea = resolved.area ? normalizeLocationQuery(resolved.area) : "";
    const targetDistrict = resolved.district
      ? normalizeLocationQuery(resolved.district)
      : "";

    if (targetArea) {
      return citiesMatchNormalized(city, resolved.city) && areaNorm.includes(targetArea);
    }
    if (targetDistrict && targetDistrict !== targetCity) {
      return (
        citiesMatchNormalized(city, resolved.city) &&
        (areaNorm.includes(targetDistrict) ||
          normalizeLocationQuery(district ?? "") === targetDistrict)
      );
    }
    return (
      citiesMatchNormalized(city, resolved.city) ||
      cityNorm.includes(targetCity) ||
      targetCity.includes(cityNorm)
    );
  }

  const q = normalizeLocationQuery(query);
  if (!q && !district) return true;

  if (district) {
    const areas = getAreasForDistrict(city, district);
    if (areas.length > 0) {
      return areas.some((a) => normalizeLocationQuery(a) === normalizeLocationQuery(area));
    }
    return normalizeLocationQuery(area).includes(normalizeLocationQuery(district));
  }

  const cityNorm = normalizeLocationQuery(city);
  const areaNorm = normalizeLocationQuery(area);

  const parts = q.split(/[,·]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const [cityPart, areaPart] = parts;
    return (
      cityNorm.includes(cityPart) &&
      (areaNorm.includes(areaPart) || cityNorm.includes(areaPart))
    );
  }

  return (
    cityNorm.includes(q) ||
    areaNorm.includes(q) ||
    q.includes(cityNorm) ||
    `${cityNorm} ${areaNorm}`.includes(q)
  );
}

export function resolveCityQuery(query: string): string {
  const resolved = resolveGreekLocation(query);
  if (resolved?.strongMatch) {
    return resolved.area ?? resolved.city;
  }

  const suggestions = searchGreekLocations(query, 1);
  if (suggestions.length > 0) {
    return formatLocationSelection(suggestions[0]);
  }

  return query.trim();
}

export { getAreasForDistrict };
