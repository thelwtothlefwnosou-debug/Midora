import {
  overpassStreetPattern,
  resolveCanonicalCityName,
  streetMatchesQuery,
} from "@/lib/geocoding/geocode-utils";
import type { AddressSuggestion } from "@/lib/geocoding/types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type OverpassElement = {
  type: "way";
  id: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    highway?: string;
    "addr:city"?: string;
    "addr:postcode"?: string;
  };
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function mapOverpassWay(
  way: OverpassElement,
  cityName: string,
  areaName?: string
): AddressSuggestion | null {
  const street = way.tags?.name?.trim();
  const center = way.center;
  if (!street || !center) return null;

  const city = way.tags?.["addr:city"]?.trim() || cityName;
  const postalCode = way.tags?.["addr:postcode"]?.trim() || null;
  const area = areaName?.trim() || null;

  return {
    placeId: `overpass-way-${way.id}`,
    primary: street,
    secondary: area ? `${area}, ${cityName}, Ελλάδα` : `${city}, Ελλάδα`,
    formattedAddress: area
      ? `${street}, ${area}, ${cityName}, Ελλάδα`
      : `${street}, ${city}, Ελλάδα`,
    lat: center.lat,
    lng: center.lon,
    street,
    streetNumber: null,
    city,
    area,
    postalCode,
  };
}

export async function searchOverpassStreetsNear(
  streetQuery: string,
  cityName: string,
  cityCenter: { lat: number; lng: number },
  limit = 8,
  radiusMeters = 18_000,
  areaName?: string
): Promise<AddressSuggestion[]> {
  const street = streetQuery.trim();
  const canonical = resolveCanonicalCityName(cityName);
  if (street.length < 1 || !cityCenter) return [];

  const pattern = overpassStreetPattern(street);
  const query = `
[out:json][timeout:20];
(
  way["highway"]["name"~"${pattern}",i](around:${radiusMeters},${cityCenter.lat},${cityCenter.lng});
);
out center ${Math.max(limit, 12)};
`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as OverpassResponse;
  const results: AddressSuggestion[] = [];

  for (const element of data.elements ?? []) {
    const mapped = mapOverpassWay(element, canonical, areaName);
    if (mapped && streetMatchesQuery(mapped.street ?? "", street)) {
      results.push(mapped);
    }
  }

  return results.slice(0, limit);
}
