import type { SearchLocation } from "@/lib/data/locations-shared";
import type { ResolvedLocation } from "@/lib/locations/search-engine";
import {
  searchGreekLocations,
  resolveLocation,
  searchWizardCitiesOnly,
  searchWizardAreaSuggestions,
  MAX_LOCATION_SUGGESTIONS,
} from "@/lib/locations/search";

type LocationSearchResponse = {
  suggestions: SearchLocation[];
  resolved: ResolvedLocation | null;
  error?: string;
};

function mergeSuggestions(
  primary: SearchLocation[],
  secondary: SearchLocation[],
  limit: number
): SearchLocation[] {
  const seen = new Set<string>();
  const merged: SearchLocation[] = [];
  for (const loc of [...primary, ...secondary]) {
    const key = `${loc.kind}:${loc.city}:${loc.area ?? loc.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(loc);
    if (merged.length >= limit) break;
  }
  return merged;
}

/** Άμεσα αποτελέσματα από τοπικό dataset — χωρίς αναμονή API. */
export function getInstantCitySuggestions(
  query: string,
  options?: { limit?: number }
): LocationSearchResponse {
  const limit = options?.limit ?? MAX_LOCATION_SUGGESTIONS;
  const trimmed = query.trim();
  const suggestions = searchWizardCitiesOnly(trimmed, limit);
  const resolved = trimmed ? resolveLocation(trimmed) : null;
  return { suggestions, resolved };
}

/** Περιοχές μέσα στην επιλεγμένη πόλη. */
export function getInstantAreaSuggestions(
  city: string,
  query: string,
  options?: { limit?: number }
): LocationSearchResponse {
  const limit = options?.limit ?? MAX_LOCATION_SUGGESTIONS;
  const suggestions = searchWizardAreaSuggestions(city.trim(), query.trim(), limit);
  return { suggestions, resolved: null };
}

/** Άμεσα αποτελέσματα (όλες οι περιοχές) — για αρχική αναζήτηση. */
export function getInstantLocationSuggestions(
  query: string,
  options?: { limit?: number; city?: string }
): LocationSearchResponse {
  const limit = options?.limit ?? MAX_LOCATION_SUGGESTIONS;
  if (options?.city?.trim()) {
    return getInstantAreaSuggestions(options.city, query, options);
  }
  const trimmed = query.trim();
  const suggestions = searchGreekLocations(trimmed, limit);
  const resolved = trimmed ? resolveLocation(trimmed) : null;
  return { suggestions, resolved };
}

export async function fetchCitySuggestions(
  query: string,
  options?: { limit?: number }
): Promise<LocationSearchResponse> {
  const limit = options?.limit ?? MAX_LOCATION_SUGGESTIONS;
  const instant = getInstantCitySuggestions(query, options);

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    scope: "cities",
  });

  try {
    const res = await fetch(`/api/locations/search?${params.toString()}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return instant;

    const data = (await res.json()) as LocationSearchResponse;
    return {
      suggestions: mergeSuggestions(data.suggestions ?? [], instant.suggestions, limit),
      resolved: data.resolved ?? instant.resolved,
      error: data.error,
    };
  } catch {
    return instant;
  }
}

export async function fetchAreaSuggestions(
  city: string,
  query: string,
  options?: { limit?: number }
): Promise<LocationSearchResponse> {
  const limit = options?.limit ?? MAX_LOCATION_SUGGESTIONS;
  const instant = getInstantAreaSuggestions(city, query, options);

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    scope: "areas",
    city,
  });

  try {
    const res = await fetch(`/api/locations/search?${params.toString()}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return instant;

    const data = (await res.json()) as LocationSearchResponse;
    return {
      suggestions: mergeSuggestions(data.suggestions ?? [], instant.suggestions, limit),
      resolved: null,
      error: data.error,
    };
  } catch {
    return instant;
  }
}

export async function fetchLocationSuggestions(
  query: string,
  options?: { limit?: number; city?: string }
): Promise<LocationSearchResponse> {
  if (options?.city?.trim()) {
    return fetchAreaSuggestions(options.city, query, options);
  }

  const limit = options?.limit ?? MAX_LOCATION_SUGGESTIONS;
  const instant = getInstantLocationSuggestions(query, options);

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  try {
    const res = await fetch(`/api/locations/search?${params.toString()}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return instant;

    const data = (await res.json()) as LocationSearchResponse;
    return {
      suggestions: mergeSuggestions(data.suggestions ?? [], instant.suggestions, limit),
      resolved: data.resolved ?? instant.resolved,
      error: data.error,
    };
  } catch {
    return instant;
  }
}
