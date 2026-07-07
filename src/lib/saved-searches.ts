import { searchDurationLabel } from "@/lib/duration-ranges";

export type SavedSearchFilters = Record<string, string>;

export function filtersToSearchParams(filters: SavedSearchFilters): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim()) p.set(key, value.trim());
  }
  return p.toString();
}

export function searchParamsToFilters(params: URLSearchParams | SavedSearchFilters): SavedSearchFilters {
  if (params instanceof URLSearchParams) {
    const out: SavedSearchFilters = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return params;
}

export function buildSavedSearchName(filters: SavedSearchFilters): string {
  const parts: string[] = [];

  if (filters.polygon) parts.push("περιοχή στον χάρτη");
  if (filters.district) parts.push(decodeURIComponent(filters.district));
  if (filters.area) parts.push(decodeURIComponent(filters.area));
  if (filters.city) parts.push(decodeURIComponent(filters.city));
  if (filters.maxPrice) parts.push(`έως €${filters.maxPrice}`);
  if (filters.minPrice) parts.push(`από €${filters.minPrice}`);
  if (filters.bedrooms) parts.push(`${filters.bedrooms} υ/δ`);
  if (filters.moveIn) parts.push(`από ${decodeURIComponent(filters.moveIn)}`);
  if (filters.duration) parts.push(searchDurationLabel(filters.duration));
  else if (filters.minMonths) parts.push(`${filters.minMonths} μήνες`);
  if (filters.furnished === "true") parts.push("επιπλωμένα");
  if (filters.parking === "true") parts.push("με parking");
  if (filters.pets === "true") parts.push("με κατοικίδια");
  if (filters.bills === "true") parts.push("λογαριασμοί περιλαμβάνονται");

  return parts.length ? parts.join(" · ") : "Η αναζήτησή μου";
}

export function savedSearchToUrl(filters: SavedSearchFilters): string {
  const qs = filtersToSearchParams(filters);
  return qs ? `/listings?${qs}` : "/listings";
}
