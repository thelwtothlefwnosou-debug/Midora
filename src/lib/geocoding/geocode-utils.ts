import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { resolveLocation } from "@/lib/locations/search";
import { citiesMatchNormalized } from "@/lib/locations/search-engine";
import { getKnownCityCoords, getKnownSuburbCoords } from "@/lib/geocoding/city-centers";
import { GREEK_AREA_CATALOG } from "@/lib/data/greek-areas";
import type { AddressSuggestion } from "@/lib/geocoding/types";

const METRO_RADIUS_KM = 45;
/** Ευρεία ακτίνα αναζήτησης οδών μέσα σε μεγάλη περιοχή/προάστιο. */
export const AREA_SEARCH_RADIUS_KM = 22;
/** Περιθώριο: αν είναι τόσο πιο κοντά σε άλλο προάστι, απορρίπτεται. */
const SUBURB_COMPETITION_MARGIN_KM = 0.35;

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

export function coordsWithinCityMetro(
  lat: number,
  lng: number,
  cityName: string,
  maxKm = METRO_RADIUS_KM
): boolean {
  const center = getKnownCityCoords(cityName);
  if (!center) return true;
  return haversineKm(center.lat, center.lng, lat, lng) <= maxKm;
}

export function resolveCanonicalCityName(cityName: string): string {
  const trimmed = cityName.trim();
  if (!trimmed) return trimmed;
  const resolved = resolveLocation(trimmed);
  return resolved?.city ?? trimmed;
}

export function cityCacheKey(cityName: string): string {
  return normalizeLocationQuery(resolveCanonicalCityName(cityName));
}

/** Ελληνικοί ΤΚ ανά πόλη — για να μην στέλνουμε λάθος ΤΚ (π.χ. 25006 με Αθήνα) στους geocoders. */
const CITY_POSTAL_RANGES: Record<string, Array<[number, number]>> = {
  αθηνα: [[10000, 19999]],
  θεσσαλονικη: [[54000, 57999]],
  πατρα: [[25000, 26999]],
  ηρακλειο: [[70000, 71999]],
  λαρισα: [[41000, 41999]],
  βολος: [[37000, 38999]],
  ιωαννινα: [[45000, 45999]],
  χανια: [[73000, 73999]],
  πτολεμαιδα: [[50000, 51999]],
  κοζανη: [[50000, 51999]],
  πειραιας: [[18000, 18999]],
};

function postalInRange(postal: string, ranges: Array<[number, number]>): boolean {
  const digits = postal.replace(/\D/g, "");
  if (digits.length < 5) return true;
  const code = parseInt(digits.slice(0, 5), 10);
  if (!Number.isFinite(code)) return true;
  return ranges.some(([min, max]) => code >= min && code <= max);
}

/** Επιστρέφει ΤΚ μόνο αν ταιριάζει με την πόλη — αλλιώς null (αποφεύγει λάθος pin στον χάρτη). */
export function postalCodeForCity(postalCode: string | undefined, cityName: string): string | undefined {
  const postal = postalCode?.trim();
  if (!postal) return undefined;
  const key = cityCacheKey(cityName);
  const ranges = CITY_POSTAL_RANGES[key];
  if (!ranges) return postal;
  return postalInRange(postal, ranges) ? postal : undefined;
}

export function mergeAddressSuggestions(
  batches: AddressSuggestion[],
  limit: number,
  options?: {
    areaCenter?: { lat: number; lng: number } | null;
  }
): AddressSuggestion[] {
  const deduped = new Map<string, AddressSuggestion>();
  const areaCenter = options?.areaCenter;

  for (const item of batches) {
    const streetKey = item.street?.trim()
      ? normalizeLocationQuery(item.street)
      : null;
    const key =
      streetKey ||
      item.placeId ||
      `${item.lat},${item.lng},${normalizeLocationQuery(item.primary)}`;

    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    if (streetKey && areaCenter) {
      const distExisting = haversineKm(
        areaCenter.lat,
        areaCenter.lng,
        existing.lat,
        existing.lng
      );
      const distNew = haversineKm(areaCenter.lat, areaCenter.lng, item.lat, item.lng);
      if (distNew < distExisting) deduped.set(key, item);
    }
  }
  return [...deduped.values()].slice(0, limit);
}

export function escapeOverpassRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function streetMatchesQuery(streetName: string, query: string): boolean {
  const nStreet = normalizeLocationQuery(streetName);
  const nQuery = normalizeLocationQuery(query);
  if (!nQuery || !nStreet) return false;

  if (nStreet.startsWith(nQuery)) return true;

  if (nQuery.length <= 2) return false;

  if (nStreet.includes(nQuery)) return true;

  const compareLen = Math.min(nStreet.length, nQuery.length, 6);
  if (compareLen >= 3) {
    let diff = 0;
    for (let i = 0; i < compareLen; i++) {
      if (nStreet[i] !== nQuery[i]) diff += 1;
      if (diff > 1) break;
    }
    if (diff <= 1) return true;
  }

  return false;
}

export function overpassStreetPattern(streetQuery: string): string {
  const normalized = normalizeLocationQuery(streetQuery.trim());
  if (!normalized) return "";
  const prefixLen = Math.min(normalized.length, 6);
  return escapeOverpassRegex(normalized.slice(0, prefixLen));
}

/** Βρίσκει προάστι/περιοχή στο catalog (π.χ. «ευοσμ» → «Εύοσμος» για Θεσσαλονίκη). */
export function findSuburbInCity(query: string, cityName: string): string | null {
  const q = normalizeLocationQuery(query.trim());
  if (q.length < 2) return null;
  const cityNorm = cityCacheKey(cityName);

  let best: { area: string; score: number } | null = null;
  for (const entry of GREEK_AREA_CATALOG) {
    if (normalizeLocationQuery(entry.city) !== cityNorm) continue;
    if (entry.area.trim() === entry.city.trim()) continue;
    const areaNorm = normalizeLocationQuery(entry.area);
    let score = 0;
    if (areaNorm === q) score = 100;
    else if (areaNorm.startsWith(q)) score = 88 - Math.min(12, areaNorm.length - q.length);
    else if (areaNorm.includes(q)) score = 62;
    if (score > 0 && (!best || score > best.score)) {
      best = { area: entry.area, score };
    }
  }
  return best && best.score >= 50 ? best.area : null;
}

export function isKnownSuburbOfCity(suburbName: string, cityName: string): boolean {
  const suburb = suburbName.trim();
  if (!suburb) return false;
  const cityNorm = cityCacheKey(cityName);
  return GREEK_AREA_CATALOG.some(
    (e) =>
      normalizeLocationQuery(e.city) === cityNorm &&
      normalizeLocationQuery(e.area) === normalizeLocationQuery(suburb) &&
      e.area.trim() !== e.city.trim()
  );
}

/** Γνωστά προάστια μιας πόλης με συντεταγμένες (για γεωγραφικό διαχωρισμό). */
export function getKnownSuburbsForCity(
  cityName: string
): Array<{ area: string; lat: number; lng: number }> {
  const cityNorm = cityCacheKey(cityName);
  const seen = new Set<string>();
  const out: Array<{ area: string; lat: number; lng: number }> = [];

  for (const entry of GREEK_AREA_CATALOG) {
    if (normalizeLocationQuery(entry.city) !== cityNorm) continue;
    if (entry.area.trim() === entry.city.trim()) continue;
    const key = normalizeLocationQuery(entry.area);
    if (seen.has(key)) continue;
    seen.add(key);
    const coords = getKnownSuburbCoords(entry.area, cityName);
    if (coords) out.push({ area: entry.area, lat: coords.lat, lng: coords.lng });
  }
  return out;
}

/** Αυστηρός έλεγχος — η πόλη στο αποτέλεσμα πρέπει να ταιριάζει ακριβώς. */
export function addressMatchesCityStrict(
  suggestion: AddressSuggestion,
  expectedCity: string
): boolean {
  const canonical = resolveCanonicalCityName(expectedCity);
  if (!canonical) return false;
  const resultCity = suggestion.city?.trim();
  if (!resultCity) return false;
  return citiesMatchNormalized(resultCity, canonical);
}

export function coordsWithinSelectedArea(
  lat: number,
  lng: number,
  cityName: string,
  areaName: string,
  maxKm = AREA_SEARCH_RADIUS_KM,
  areaCenter?: { lat: number; lng: number } | null
): boolean {
  const center = areaCenter ?? getKnownSuburbCoords(areaName, cityName);
  if (!center) return false;
  return haversineKm(center.lat, center.lng, lat, lng) <= maxKm;
}

/** Το αποτέλεσμα αναφέρει ρητά άλλο προάστι από αυτό που επέλεξε ο χρήστης. */
export function suggestionNamesDifferentSuburb(
  suggestion: AddressSuggestion,
  cityName: string,
  lockedArea: string
): boolean {
  const lockedNorm = normalizeLocationQuery(lockedArea);
  const fields = [suggestion.area, suggestion.city].filter(Boolean) as string[];
  for (const field of fields) {
    if (!isKnownSuburbOfCity(field, cityName)) continue;
    if (normalizeLocationQuery(field) !== lockedNorm) return true;
  }
  return false;
}

/** Η διεύθυνση αναφέρει άλλο προάστι στο κείμενο (π.χ. «Καλαμαριά» όταν επέλεξες Εύοσμο). */
export function suggestionReferencesDifferentSuburb(
  suggestion: AddressSuggestion,
  cityName: string,
  lockedArea: string
): boolean {
  const lockedNorm = normalizeLocationQuery(lockedArea);
  const haystack = normalizeLocationQuery(
    [suggestion.area, suggestion.city, suggestion.formattedAddress, suggestion.secondary]
      .filter(Boolean)
      .join(" ")
  );
  const cityNorm = cityCacheKey(cityName);

  for (const entry of GREEK_AREA_CATALOG) {
    if (normalizeLocationQuery(entry.city) !== cityNorm) continue;
    if (entry.area.trim() === entry.city.trim()) continue;
    const areaNorm = normalizeLocationQuery(entry.area);
    if (areaNorm === lockedNorm || areaNorm.length < 4) continue;
    if (haystack.includes(areaNorm)) return true;
  }
  return false;
}

/**
 * Γεωγραφικός έλεγχος περιοχής — λειτουργεί για ΟΠΟΙΑΔΗΠΟΤΕ περιοχή στην Ελλάδα
 * όταν δοθούν συντεταγμένες κέντρου (από geocoder, όχι μόνο από κατάλογο).
 */
export function belongsToLockedArea(
  lat: number,
  lng: number,
  cityName: string,
  lockedArea: string,
  areaCenter?: { lat: number; lng: number } | null
): boolean {
  const canonical = resolveCanonicalCityName(cityName);
  const area = lockedArea.trim();
  const lockedCenter = areaCenter ?? getKnownSuburbCoords(area, canonical);

  if (!lockedCenter) {
    return true;
  }

  const distToLocked = haversineKm(lat, lng, lockedCenter.lat, lockedCenter.lng);
  if (distToLocked > AREA_SEARCH_RADIUS_KM) return false;

  const lockedNorm = normalizeLocationQuery(area);
  for (const suburb of getKnownSuburbsForCity(canonical)) {
    if (normalizeLocationQuery(suburb.area) === lockedNorm) continue;
    const distToOther = haversineKm(lat, lng, suburb.lat, suburb.lng);
    if (distToOther + SUBURB_COMPETITION_MARGIN_KM < distToLocked) return false;
  }

  return true;
}

/**
 * Έλεγχος προτάσεων οδού — με κλειδωμένη περιοχή μόνο οδούς εντός της περιοχής.
 */
export function streetSuggestionMatchesScope(
  suggestion: AddressSuggestion,
  expectedCity: string,
  lockedArea?: string,
  areaCenter?: { lat: number; lng: number } | null
): boolean {
  const area = lockedArea?.trim();
  if (!area) {
    return streetSuggestionMatchesCity(suggestion, expectedCity);
  }

  const canonical = resolveCanonicalCityName(expectedCity);
  if (!canonical) return false;

  if (!suggestion.street?.trim()) {
    return (
      normalizeLocationQuery(area) ===
        normalizeLocationQuery(suggestion.area ?? suggestion.primary) &&
      addressMatchesSelectedCity(suggestion, canonical)
    );
  }

  if (suggestionNamesDifferentSuburb(suggestion, canonical, area)) {
    return false;
  }

  if (areaCenter && suggestionReferencesDifferentSuburb(suggestion, canonical, area)) {
    return false;
  }

  if (belongsToLockedArea(suggestion.lat, suggestion.lng, canonical, area, areaCenter)) {
    return true;
  }

  const suburb = suggestion.area?.trim() || suggestion.city?.trim();
  if (suburb && normalizeLocationQuery(suburb) === normalizeLocationQuery(area)) {
    return true;
  }

  const normAddr = normalizeLocationQuery(suggestion.formattedAddress);
  return normAddr.includes(normalizeLocationQuery(area));
}

/**
 * Έλεγχος για προτάσεις οδών — πιο επιεικές: οδός εντός μητροπολιτικής ακτίνας αρκεί.
 */
export function streetSuggestionMatchesCity(
  suggestion: AddressSuggestion,
  expectedCity: string
): boolean {
  if (!suggestion.street?.trim()) {
    return addressMatchesSelectedCity(suggestion, expectedCity);
  }

  const canonical = resolveCanonicalCityName(expectedCity);
  if (!canonical) return false;

  if (suggestion.city?.trim() && citiesMatchNormalized(suggestion.city, canonical)) {
    return true;
  }

  const suburb = suggestion.area?.trim() || suggestion.city?.trim();
  if (suburb && isKnownSuburbOfCity(suburb, canonical)) {
    return coordsWithinCityMetro(suggestion.lat, suggestion.lng, canonical);
  }

  if (coordsWithinCityMetro(suggestion.lat, suggestion.lng, canonical)) {
    return true;
  }

  return addressMatchesSelectedCity(suggestion, expectedCity);
}

/**
 * Έλεγχος για αναζήτηση περιοχής ή pin — κεντρική πόλη ή γνωστό προάστι εντός ακτίνας.
 */
export function addressMatchesSelectedCity(
  suggestion: AddressSuggestion,
  expectedCity: string
): boolean {
  const canonical = resolveCanonicalCityName(expectedCity);
  if (!canonical) return false;

  if (suggestion.city?.trim() && citiesMatchNormalized(suggestion.city, canonical)) {
    return true;
  }

  const suburb = suggestion.area?.trim() || suggestion.city?.trim();
  if (suburb && isKnownSuburbOfCity(suburb, canonical)) {
    return coordsWithinCityMetro(suggestion.lat, suggestion.lng, canonical);
  }

  if (coordsWithinCityMetro(suggestion.lat, suggestion.lng, canonical)) {
    if (postalCodeForCity(suggestion.postalCode ?? undefined, canonical)) return true;
    const normAddr = normalizeLocationQuery(suggestion.formattedAddress);
    const normCity = normalizeLocationQuery(canonical);
    if (normCity && normAddr.includes(normCity)) return true;
  }

  return false;
}

/** Έλεγχος για κλικ/πείρο στον χάρτη — εντός ακτίνας πόλης + έγκυρος ΤΚ ή προάστιο. */
export function pinLocationMatchesCity(
  suggestion: AddressSuggestion,
  expectedCity: string,
  coords: { lat: number; lng: number }
): boolean {
  const canonical = resolveCanonicalCityName(expectedCity);
  if (!canonical) return false;

  if (!coordsWithinCityMetro(coords.lat, coords.lng, canonical)) {
    return false;
  }

  if (suggestion.city?.trim() && citiesMatchNormalized(suggestion.city, canonical)) {
    return true;
  }

  if (postalCodeForCity(suggestion.postalCode ?? undefined, canonical)) {
    return true;
  }

  const suburb = suggestion.area?.trim() || suggestion.city?.trim();
  if (suburb && !citiesMatchNormalized(suburb, canonical)) {
    return true;
  }

  return addressMatchesCityStrict(suggestion, canonical);
}

/** Έλεγχος pin — εντός πόλης και (αν έχει επιλεγεί) εντός συγκεκριμένης περιοχής. */
export function pinLocationMatchesScope(
  suggestion: AddressSuggestion,
  expectedCity: string,
  coords: { lat: number; lng: number },
  lockedArea?: string,
  areaCenter?: { lat: number; lng: number } | null
): boolean {
  if (!pinLocationMatchesCity(suggestion, expectedCity, coords)) return false;
  const area = lockedArea?.trim();
  if (!area) return true;
  if (suggestionNamesDifferentSuburb(suggestion, expectedCity, area)) return false;
  if (suggestionReferencesDifferentSuburb(suggestion, expectedCity, area)) return false;
  return belongsToLockedArea(coords.lat, coords.lng, expectedCity, area, areaCenter);
}

/** @deprecated Χρησιμοποίησε addressMatchesSelectedCity ή addressMatchesCityStrict. */
export function addressMatchesCity(
  suggestion: AddressSuggestion,
  expectedCity: string
): boolean {
  return addressMatchesSelectedCity(suggestion, expectedCity);
}

/** Εξαγωγή περιοχής/προαστίου από reverse geocode (π.χ. Θέρμη για Θεσσαλονίκη). */
export function extractAreaFromPinResult(
  suggestion: AddressSuggestion,
  lockedCity: string
): string | undefined {
  const canonical = resolveCanonicalCityName(lockedCity);
  const area = suggestion.area?.trim();
  if (area && !citiesMatchNormalized(area, canonical)) return area;
  const cityField = suggestion.city?.trim();
  if (cityField && !citiesMatchNormalized(cityField, canonical)) return cityField;

  const haystack = normalizeLocationQuery(
    [suggestion.formattedAddress, suggestion.secondary, suggestion.primary]
      .filter(Boolean)
      .join(" ")
  );
  if (!haystack) return undefined;

  const cityNorm = cityCacheKey(canonical);
  let best: { area: string; score: number } | null = null;
  for (const entry of GREEK_AREA_CATALOG) {
    if (normalizeLocationQuery(entry.city) !== cityNorm) continue;
    if (entry.area.trim() === entry.city.trim()) continue;
    const areaNorm = normalizeLocationQuery(entry.area);
    if (areaNorm.length < 3) continue;
    let score = 0;
    if (haystack.includes(areaNorm)) score = areaNorm.length;
    if (score > 0 && (!best || score > best.score)) {
      best = { area: entry.area, score };
    }
  }
  return best?.area;
}

/** Διαχωρισμός «Οδός 17» ή «Λεωφ. Συγγρού 117α» σε οδό + αριθμό. */
export function parseStreetAndNumber(input: string): { street: string; number: string } {
  const trimmed = input.trim();
  if (!trimmed) return { street: "", number: "" };

  const trailingNumber = trimmed.match(/^(.+?)\s+(\d+[α-ωΑ-Ω]?)$/);
  if (trailingNumber) {
    return { street: trailingNumber[1].trim(), number: trailingNumber[2] };
  }

  const leadingNumber = trimmed.match(/^(\d+[α-ωΑ-Ω]?)\s+(.+)$/);
  if (leadingNumber) {
    return { street: leadingNumber[2].trim(), number: leadingNumber[1] };
  }

  return { street: trimmed, number: "" };
}
