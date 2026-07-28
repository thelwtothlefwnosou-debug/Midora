import { getKnownCityCenter, getKnownCityCoords, getKnownSuburbCenter, getKnownSuburbCoords } from "@/lib/geocoding/city-centers";
import {
  cityCacheKey,
  coordsWithinCityMetro,
  findSuburbInCity,
  isKnownSuburbOfCity,
  mergeAddressSuggestions,
  postalCodeForCity,
  resolveCanonicalCityName,
  streetMatchesQuery,
  streetSuggestionMatchesScope,
} from "@/lib/geocoding/geocode-utils";
import { searchOverpassStreetsNear } from "@/lib/geocoding/overpass-streets";
import {
  geocodePhotonAddressInCity,
  searchPhotonStreetsInCity,
} from "@/lib/geocoding/photon";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { citiesMatchNormalized } from "@/lib/locations/search-engine";

import type { AddressSuggestion } from "@/lib/geocoding/types";

export type { AddressSuggestion };

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Midora/1.0 (property-listing-portal)";
const CITY_RADIUS_KM = 45;

type NominatimAddress = {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

const cityCenterCache = new Map<string, { lat: number; lng: number }>();
const areaCenterCache = new Map<string, { lat: number; lng: number }>();
const streetSearchCache = new Map<string, { at: number; results: AddressSuggestion[] }>();
const STREET_CACHE_TTL_MS = 45_000;

function rankStreetSuggestions(
  suggestions: AddressSuggestion[],
  streetQuery: string,
  searchCenter?: { lat: number; lng: number } | null
): AddressSuggestion[] {
  const nq = normalizeLocationQuery(streetQuery);
  if (!nq) return suggestions;

  return [...suggestions].sort((a, b) => {
    const as = normalizeLocationQuery(a.street ?? a.primary);
    const bs = normalizeLocationQuery(b.street ?? b.primary);
    const textScore = (name: string) => {
      if (name.startsWith(nq)) return 0;
      if (nq.length >= 3 && name.includes(nq)) return 1;
      return 2;
    };
    const textDiff = textScore(as) - textScore(bs);
    if (textDiff !== 0) return textDiff;

    if (searchCenter) {
      const da = haversineKm(searchCenter.lat, searchCenter.lng, a.lat, a.lng);
      const db = haversineKm(searchCenter.lat, searchCenter.lng, b.lat, b.lng);
      return da - db;
    }
    return 0;
  });
}

function mergeOpts(
  areaName: string | undefined,
  searchCenter: { lat: number; lng: number } | null | undefined
) {
  return areaName && searchCenter ? { areaCenter: searchCenter } : undefined;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickCity(address: NominatimAddress): string | null {
  return (
    address.city ??
    address.town ??
    address.municipality ??
    address.village ??
    null
  );
}

function pickArea(address: NominatimAddress, city: string | null): string | null {
  const area =
    address.suburb ??
    address.neighbourhood ??
    address.village ??
    null;
  if (area && city && area.toLowerCase() === city.toLowerCase()) return null;
  return area;
}

function buildPrimary(address: NominatimAddress, displayName: string): string {
  const road = address.road?.trim();
  const number = address.house_number?.trim();
  if (road && number) return `${road} ${number}`;
  if (road) return road;
  const first = displayName.split(",")[0]?.trim();
  return first || displayName;
}

function buildSecondary(address: NominatimAddress): string {
  const city = pickCity(address);
  const state = address.state?.trim();
  const country = address.country?.trim() ?? "Ελλάδα";
  const parts = [city, state, country].filter(Boolean);
  return parts.join(", ");
}

function mapResult(item: NominatimResult): AddressSuggestion {
  const address = item.address ?? {};
  const city = pickCity(address);
  const area = pickArea(address, city);
  const street = address.road?.trim() || null;
  const streetNumber = address.house_number?.trim() || null;

  return {
    placeId: String(item.place_id),
    primary: buildPrimary(address, item.display_name),
    secondary: buildSecondary(address),
    formattedAddress: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    street,
    streetNumber,
    city,
    area,
    postalCode: address.postcode?.trim() || null,
  };
}

async function nominatimFetch(
  params: URLSearchParams
): Promise<NominatimResult[]> {
  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];
  const data = (await res.json()) as NominatimResult[];
  return data ?? [];
}

function buildViewbox(center: { lat: number; lng: number }, delta = 0.07): string {
  const left = center.lng - delta;
  const right = center.lng + delta;
  const top = center.lat + delta;
  const bottom = center.lat - delta;
  return `${left},${top},${right},${bottom}`;
}

function cityNameMatches(result: AddressSuggestion, expectedCity: string): boolean {
  const canonical = resolveCanonicalCityName(expectedCity);
  if (result.city && citiesMatchNormalized(result.city, canonical)) return true;
  if (result.area && citiesMatchNormalized(result.area, canonical)) return true;
  if (result.city && isKnownSuburbOfCity(result.city, canonical)) return true;
  if (result.area && isKnownSuburbOfCity(result.area, canonical)) return true;
  const normAddr = normalizeLocationQuery(result.formattedAddress);
  const normCity = normalizeLocationQuery(canonical);
  if (normCity && normAddr.includes(normCity)) return true;
  return false;
}

function withinCityRadius(
  result: AddressSuggestion,
  cityCenter: { lat: number; lng: number } | null | undefined
): boolean {
  if (!cityCenter) return true;
  return haversineKm(cityCenter.lat, cityCenter.lng, result.lat, result.lng) <= CITY_RADIUS_KM;
}

export function filterAddressesForCity(
  suggestions: AddressSuggestion[],
  expectedCity: string,
  cityCenter?: { lat: number; lng: number } | null,
  lockedArea?: string
): AddressSuggestion[] {
  return suggestions.filter((s) => {
    if (lockedArea?.trim()) {
      return streetSuggestionMatchesScope(s, expectedCity, lockedArea, cityCenter);
    }
    if (s.street?.trim()) {
      if (cityCenter && withinCityRadius(s, cityCenter)) return true;
      if (coordsWithinCityMetro(s.lat, s.lng, expectedCity)) return true;
    }
    if (s.city?.trim() && !cityNameMatches(s, expectedCity)) return false;
    if (cityNameMatches(s, expectedCity)) return true;
    if (cityCenter && withinCityRadius(s, cityCenter) && !s.city?.trim()) return true;
    return false;
  });
}

export function pickAddressForCity(
  suggestions: AddressSuggestion[],
  expectedCity: string,
  streetNumber?: string,
  cityCenter?: { lat: number; lng: number } | null,
  lockedArea?: string
): AddressSuggestion | null {
  const pool = filterAddressesForCity(suggestions, expectedCity, cityCenter, lockedArea);
  if (!pool.length) return null;

  const targetNumber = streetNumber?.trim();
  if (targetNumber) {
    const exact = pool.find((s) => s.streetNumber === targetNumber);
    if (exact) return exact;
  }
  return pool[0] ?? null;
}

async function getCityCenter(
  cityName: string
): Promise<{ lat: number; lng: number } | null> {
  const key = cityCacheKey(cityName);
  const cached = cityCenterCache.get(key);
  if (cached) return cached;

  const known = getKnownCityCoords(cityName);
  if (known) {
    cityCenterCache.set(key, known);
    return known;
  }

  const center = await geocodeCityCenter(cityName);
  if (!center) return null;

  const coords = { lat: center.lat, lng: center.lng };
  cityCenterCache.set(key, coords);
  return coords;
}

async function resolveAreaCenter(
  areaName: string,
  cityName: string,
  cityCenter: { lat: number; lng: number } | null
): Promise<{ lat: number; lng: number } | null> {
  const key = `${cityCacheKey(cityName)}|${normalizeLocationQuery(areaName)}`;
  const cached = areaCenterCache.get(key);
  if (cached) return cached;

  const known = getKnownSuburbCoords(areaName, cityName);
  if (known) {
    areaCenterCache.set(key, known);
    return known;
  }

  const geocoded = await geocodeSuburbInCity(areaName, cityName, cityCenter);
  if (geocoded) {
    const coords = { lat: geocoded.lat, lng: geocoded.lng };
    areaCenterCache.set(key, coords);
    return coords;
  }

  return null;
}

async function searchStructuredInCity(
  street: string,
  cityName: string,
  options?: { streetNumber?: string; postalCode?: string; area?: string }
): Promise<AddressSuggestion[]> {
  const canonical = resolveCanonicalCityName(cityName);
  const area = options?.area?.trim();
  const streetLine = options?.streetNumber?.trim()
    ? `${street.trim()} ${options.streetNumber.trim()}`
    : street.trim();

  const params = new URLSearchParams({
    format: "json",
    street: streetLine,
    city: area || canonical,
    country: "Greece",
    countrycodes: "gr",
    limit: "8",
    addressdetails: "1",
    "accept-language": "el",
  });

  const postal = options?.postalCode?.trim();
  if (postal) {
    const validPostal = postalCodeForCity(postal, canonical);
    if (validPostal) params.set("postalcode", validPostal);
  }

  const data = await nominatimFetch(params);
  return data.map(mapResult);
}

async function searchBoundedInCity(
  query: string,
  cityName: string,
  cityCenter: { lat: number; lng: number },
  viewboxDelta = 0.07,
  areaName?: string
): Promise<AddressSuggestion[]> {
  const canonical = resolveCanonicalCityName(cityName);
  const trimmed = query.trim();
  const area = areaName?.trim();
  const q = area
    ? `${trimmed}, ${area}, ${canonical}, Greece`
    : `${trimmed}, ${canonical}, Greece`;

  const params = new URLSearchParams({
    format: "json",
    q,
    limit: "15",
    addressdetails: "1",
    countrycodes: "gr",
    "accept-language": "el",
    viewbox: buildViewbox(cityCenter, viewboxDelta),
    bounded: "1",
  });

  const data = await nominatimFetch(params);
  return data.map(mapResult);
}

export async function searchGreeceAddresses(
  query: string,
  limit = 8,
  options?: { city?: string; minLength?: number; postalCode?: string }
): Promise<AddressSuggestion[]> {
  const raw = query.trim();
  const minLength = options?.minLength ?? 3;
  if (raw.length < minLength) return [];

  const city = options?.city?.trim();
  if (city) {
    return searchStreetsInCity(raw, city, limit, {
      postalCode: options?.postalCode,
    });
  }

  let q = raw;
  if (!raw.toLowerCase().includes("greece") && !raw.toLowerCase().includes("ελλάδα")) {
    q = `${raw}, Greece`;
  }

  const params = new URLSearchParams({
    format: "json",
    q,
    limit: String(limit),
    addressdetails: "1",
    countrycodes: "gr",
    "accept-language": "el",
  });

  const data = await nominatimFetch(params);
  return (data ?? []).map(mapResult);
}

async function geocodeSuburbInCity(
  suburbName: string,
  cityName: string,
  cityCenter?: { lat: number; lng: number } | null
): Promise<AddressSuggestion | null> {
  const canonical = resolveCanonicalCityName(cityName);
  const known = getKnownSuburbCenter(suburbName, canonical);
  if (known) return known;

  const params = new URLSearchParams({
    format: "json",
    q: `${suburbName}, ${canonical}, Greece`,
    limit: "6",
    addressdetails: "1",
    countrycodes: "gr",
    "accept-language": "el",
  });
  if (cityCenter) {
    params.set("viewbox", buildViewbox(cityCenter));
    params.set("bounded", "1");
  }

  const data = await nominatimFetch(params);
  const pool = filterAddressesForCity(
    data.map(mapResult),
    canonical,
    cityCenter
  );
  const match = pool[0];
  if (!match) return getKnownSuburbCenter(suburbName, canonical);

  return {
    ...match,
    placeId: `suburb-${cityCacheKey(canonical)}-${normalizeLocationQuery(suburbName)}`,
    primary: suburbName,
    street: null,
    area: suburbName,
    city: canonical,
    formattedAddress: `${suburbName}, ${canonical}, Ελλάδα`,
  };
}

function centerCacheKey(center?: { lat: number; lng: number } | null): string {
  if (!center) return "";
  return `${center.lat.toFixed(3)},${center.lng.toFixed(3)}`;
}

export async function searchStreetsInCity(
  streetQuery: string,
  cityName: string,
  limit = 12,
  options?: {
    streetNumber?: string;
    postalCode?: string;
    fast?: boolean;
    area?: string;
    center?: { lat: number; lng: number };
  }
): Promise<AddressSuggestion[]> {
  const street = streetQuery.trim();
  const city = cityName.trim();
  if (street.length < 1 || city.length < 2) return [];

  const safePostal = postalCodeForCity(options?.postalCode, city);
  const areaName = options?.area?.trim();

  const cacheKeyStr = `${cityCacheKey(city)}|${normalizeLocationQuery(street)}|${areaName ? normalizeLocationQuery(areaName) : ""}|${safePostal ?? ""}|${options?.streetNumber ?? ""}|${centerCacheKey(options?.center)}|${options?.fast ? "fast" : "full"}`;
  const cached = streetSearchCache.get(cacheKeyStr);
  if (cached && Date.now() - cached.at < STREET_CACHE_TTL_MS) {
    return cached.results.slice(0, limit);
  }

  const cityCenter = await getCityCenter(city);
  const resolvedAreaCenter = areaName
    ? await resolveAreaCenter(areaName, city, cityCenter)
    : null;
  const searchCenter = options?.center ?? resolvedAreaCenter ?? cityCenter;
  const scopeCenter = resolvedAreaCenter ?? options?.center ?? cityCenter;
  const viewboxDelta = areaName || options?.center ? 0.1 : 0.14;
  const overpassRadius = areaName || options?.center ? 22_000 : 40_000;

  const qNorm = normalizeLocationQuery(street);
  const suburbName = findSuburbInCity(street, city);
  if (
    suburbName &&
    qNorm === normalizeLocationQuery(suburbName) &&
    !options?.streetNumber?.trim() &&
    !areaName
  ) {
    const suburbPlace = await geocodeSuburbInCity(suburbName, city, cityCenter);
    if (suburbPlace) {
      const results = mergeAddressSuggestions([suburbPlace], limit);
      streetSearchCache.set(cacheKeyStr, { at: Date.now(), results });
      return results;
    }
  }

  if (options?.streetNumber?.trim() && searchCenter) {
    const exactAddress = await geocodePhotonAddressInCity(
      street,
      city,
      options.streetNumber,
      searchCenter
    );
    if (
      exactAddress &&
      streetMatchesQuery(exactAddress.street ?? "", street) &&
      streetSuggestionMatchesScope(exactAddress, city, areaName, searchCenter)
    ) {
      const results = mergeAddressSuggestions([exactAddress], limit);
      streetSearchCache.set(cacheKeyStr, { at: Date.now(), results });
      return results;
    }

    const structured = await searchStructuredInCity(street, city, {
      streetNumber: options.streetNumber,
      postalCode: safePostal,
      area: areaName,
    });
    const structuredPick = pickAddressForCity(
      structured,
      city,
      options.streetNumber,
      searchCenter,
      areaName
    );
    if (structuredPick) {
      const results = mergeAddressSuggestions([structuredPick], limit);
      streetSearchCache.set(cacheKeyStr, { at: Date.now(), results });
      return results;
    }
  }

  if (options?.fast) {
    const boundedPromise = searchCenter
      ? searchBoundedInCity(street, city, searchCenter, viewboxDelta, areaName)
      : Promise.resolve([]);

    const [photon, overpass, bounded] = await Promise.all([
      searchPhotonStreetsInCity(street, city, searchCenter, limit, areaName),
      searchCenter
        ? searchOverpassStreetsNear(
            street,
            city,
            searchCenter,
            limit,
            overpassRadius,
            areaName
          )
        : Promise.resolve([]),
      boundedPromise,
    ]);

  let filtered = rankStreetSuggestions(
    filterAddressesForCity([...photon, ...overpass, ...bounded], city, searchCenter, areaName).filter(
      (s) => streetMatchesQuery(s.street ?? s.primary, street)
    ),
    street,
    searchCenter
  );

    if (!areaName && filtered.length < 5 && searchCenter) {
      const extraBounded = await searchBoundedInCity(
        street,
        city,
        searchCenter,
        viewboxDelta
      );
      filtered = rankStreetSuggestions(
        filterAddressesForCity([...filtered, ...extraBounded], city, searchCenter, areaName),
        street,
        searchCenter
      );
    }

    const results = mergeAddressSuggestions(filtered, limit, mergeOpts(areaName, scopeCenter));
    streetSearchCache.set(cacheKeyStr, { at: Date.now(), results });
    return results;
  }

  const boundedQuery = options?.streetNumber?.trim()
    ? `${street} ${options.streetNumber.trim()}`
    : street;

  const [photon, structured, bounded] = await Promise.all([
    searchPhotonStreetsInCity(street, city, searchCenter, limit, areaName),
    searchStructuredInCity(street, city, {
      streetNumber: options?.streetNumber,
      postalCode: safePostal,
      area: areaName,
    }),
    searchCenter
      ? searchBoundedInCity(boundedQuery, city, searchCenter, viewboxDelta, areaName)
      : Promise.resolve([]),
  ]);

  let pool = [...photon, ...structured, ...bounded];
  let filtered = rankStreetSuggestions(
    filterAddressesForCity(pool, city, searchCenter, areaName).filter((s) =>
      streetMatchesQuery(s.street ?? s.primary, street)
    ),
    street,
    searchCenter
  );

  if (filtered.length < limit && searchCenter) {
    const overpass = await searchOverpassStreetsNear(
      street,
      city,
      searchCenter,
      limit,
      overpassRadius,
      areaName
    );
    filtered = rankStreetSuggestions(
      filterAddressesForCity([...filtered, ...overpass], city, searchCenter, areaName).filter((s) =>
        streetMatchesQuery(s.street ?? s.primary, street)
      ),
      street,
      searchCenter
    );
  }

  if (!filtered.length) {
    const canonical = resolveCanonicalCityName(city);
    const locationHint = areaName ? `${street}, ${areaName}` : street;
    let freeText = `${locationHint}, ${canonical}, Greece`;
    if (safePostal) {
      freeText = `${locationHint}, ${safePostal}, ${canonical}, Greece`;
    }

    const freeParams = new URLSearchParams({
      format: "json",
      q: freeText,
      limit: String(Math.max(limit, 15)),
      addressdetails: "1",
      countrycodes: "gr",
      "accept-language": "el",
    });
    if (searchCenter) {
      freeParams.set("viewbox", buildViewbox(searchCenter, viewboxDelta));
      freeParams.set("bounded", "1");
    }
    const freeResults = (await nominatimFetch(freeParams)).map(mapResult);
    filtered = rankStreetSuggestions(
      filterAddressesForCity(freeResults, city, searchCenter, areaName).filter((s) =>
        streetMatchesQuery(s.street ?? s.primary, street)
      ),
      street,
      searchCenter
    );
  }

  const results = mergeAddressSuggestions(filtered, limit, mergeOpts(areaName, scopeCenter));
  streetSearchCache.set(cacheKeyStr, { at: Date.now(), results });
  return results;
}

/** Γεωκωδικοποίηση οποιασδήποτε περιοχής/συνοικίας εντός πόλης (χωρίς κατάλογο). */
export async function geocodeAreaCenter(
  areaName: string,
  cityName: string
): Promise<{ lat: number; lng: number } | null> {
  const area = areaName.trim();
  const city = cityName.trim();
  if (area.length < 2 || city.length < 2) return null;
  const cityCenter = await getCityCenter(city);
  return resolveAreaCenter(area, city, cityCenter);
}

export async function geocodeCityCenter(cityName: string): Promise<AddressSuggestion | null> {
  const canonical = resolveCanonicalCityName(cityName);
  if (canonical.length < 2) return null;

  const known = getKnownCityCenter(cityName);
  if (known) return known;

  const structured = new URLSearchParams({
    format: "json",
    city: canonical,
    country: "Greece",
    countrycodes: "gr",
    limit: "5",
    addressdetails: "1",
    "accept-language": "el",
  });

  const structuredResults = (await nominatimFetch(structured)).map(mapResult);
  const structuredMatch = pickAddressForCity(structuredResults, canonical);
  if (structuredMatch) return structuredMatch;

  const freeParams = new URLSearchParams({
    format: "json",
    q: `${canonical}, Ελλάδα`,
    limit: "8",
    addressdetails: "1",
    countrycodes: "gr",
    "accept-language": "el",
  });
  const freeResults = (await nominatimFetch(freeParams)).map(mapResult);
  return pickAddressForCity(freeResults, canonical) ?? getKnownCityCenter(cityName);
}

export async function reverseGeocodeGreece(
  lat: number,
  lng: number
): Promise<AddressSuggestion | null> {
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    "accept-language": "el",
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResult;
  if (!data?.lat || !data?.lon) return null;
  return mapResult(data);
}

export function buildExternalMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
