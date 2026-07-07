/** @deprecated Import from @/lib/locationSearch instead */
export {
  normalizeText as normalizeSearchText,
  searchLocations,
  resolveCanonicalLocation,
  resolveLocation,
  canonicalDisplayLabel,
  canonicalDisplayLabel as canonicalLocationLabel,
  MIN_LOCATION_QUERY_LENGTH,
  type CanonicalLocation,
} from "@/lib/locationSearch";

import {
  resolveCanonicalLocation,
  type CanonicalLocation,
} from "@/lib/locationSearch";

export type NormalizedLocation = {
  canonical: string;
  city: string;
  area?: string;
  district?: string;
  region?: string;
};

export function normalizeSearchLocation(input: string): NormalizedLocation | null {
  const loc = resolveCanonicalLocation(input);
  if (!loc) return null;
  return {
    canonical: loc.label,
    city: loc.city,
    area: loc.area,
    district: loc.district,
    region: loc.region,
  };
}
