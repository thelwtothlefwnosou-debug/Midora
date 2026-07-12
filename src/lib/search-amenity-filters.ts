import {
  BILLS_AMENITY_KEYS,
  FURNISHED_AMENITY_KEYS,
  isKnownAmenityKey,
  normalizeAmenityKey,
  PARKING_AMENITY_KEYS,
} from "@/lib/amenities-catalog";

export function parseAmenityFilterParam(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((part) => normalizeAmenityKey(part.trim()))
        .filter(isKnownAmenityKey)
    ),
  ];
}

export function serializeAmenityFilterParam(keys: Iterable<string>): string {
  return [...new Set([...keys].map(normalizeAmenityKey).filter(isKnownAmenityKey))].join(",");
}

export function amenityKeySetsParking(key: string): boolean {
  return PARKING_AMENITY_KEYS.has(normalizeAmenityKey(key));
}

export function amenityKeySetsFurnished(key: string): boolean {
  return FURNISHED_AMENITY_KEYS.has(normalizeAmenityKey(key));
}

export function amenityKeySetsBills(key: string): boolean {
  return BILLS_AMENITY_KEYS.has(normalizeAmenityKey(key));
}

export function amenityKeySetsPets(key: string): boolean {
  const normalized = normalizeAmenityKey(key);
  return normalized === "pets_allowed" || normalized === "pets_on_request";
}

export function amenityKeySetsClimate(key: string): boolean {
  const normalized = normalizeAmenityKey(key);
  return normalized === "ac" || normalized === "heating";
}
