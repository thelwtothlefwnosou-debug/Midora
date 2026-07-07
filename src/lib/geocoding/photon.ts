import { resolveCanonicalCityName, streetMatchesQuery } from "@/lib/geocoding/geocode-utils";
import type { AddressSuggestion } from "@/lib/geocoding/types";

const PHOTON_BASE = "https://photon.komoot.io/api/";

type PhotonFeature = {
  type: "Feature";
  properties: {
    osm_type: string;
    osm_id: number;
    type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    countrycode?: string;
    street?: string;
    housenumber?: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

function mapPhotonFeature(
  feature: PhotonFeature,
  cityName: string,
  areaName?: string
): AddressSuggestion | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates;
  if (!coords?.length || coords.length < 2) return null;

  const street = props.name?.trim() || props.street?.trim() || null;
  if (!street) return null;

  const city = props.city?.trim() || cityName;
  const area = areaName?.trim() || props.county?.trim() || null;
  const lng = coords[0];
  const lat = coords[1];
  const postalCode = props.postcode?.replace(/\s/g, "") || null;

  return {
    placeId: `photon-${props.osm_type}-${props.osm_id}`,
    primary: props.housenumber ? `${street} ${props.housenumber}` : street,
    secondary: [city, props.state, props.country ?? "Ελλάδα"].filter(Boolean).join(", "),
    formattedAddress: [street, props.housenumber, city, props.postcode, props.country ?? "Ελλάδα"]
      .filter(Boolean)
      .join(", "),
    lat,
    lng,
    street,
    streetNumber: props.housenumber?.trim() || null,
    city,
    area: area,
    postalCode,
  };
}

function isStreetFeature(feature: PhotonFeature): boolean {
  const props = feature.properties;
  if (props.osm_key === "highway") return true;
  if (props.type === "street") return true;
  if (props.street && props.housenumber) return true;
  return false;
}

export async function geocodePhotonAddressInCity(
  street: string,
  cityName: string,
  streetNumber: string,
  cityCenter?: { lat: number; lng: number } | null
): Promise<AddressSuggestion | null> {
  const canonical = resolveCanonicalCityName(cityName);
  const number = streetNumber.trim();
  if (!street.trim() || !number || canonical.length < 2) return null;

  const params = new URLSearchParams({
    q: `${street.trim()} ${number}, ${canonical}, Greece`,
    limit: "12",
    osm_tag: "highway",
  });
  if (cityCenter) {
    params.set("lat", String(cityCenter.lat));
    params.set("lon", String(cityCenter.lng));
  }

  const res = await fetch(`${PHOTON_BASE}?${params}`, { next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = (await res.json()) as PhotonResponse;
  const candidates: AddressSuggestion[] = [];

  for (const feature of data.features ?? []) {
    if (feature.properties.countrycode && feature.properties.countrycode !== "GR") continue;
    if (!isStreetFeature(feature)) continue;
    const item = mapPhotonFeature(feature, canonical);
    if (!item?.street) continue;
    if (!streetMatchesQuery(item.street, street)) continue;
    candidates.push(item);
  }

  const exact = candidates.find((c) => c.streetNumber === number);
  if (exact) return exact;

  return candidates[0] ?? null;
}

export async function searchPhotonStreetsInCity(
  streetQuery: string,
  cityName: string,
  cityCenter?: { lat: number; lng: number } | null,
  limit = 12,
  area?: string
): Promise<AddressSuggestion[]> {
  const street = streetQuery.trim();
  const canonical = resolveCanonicalCityName(cityName);
  if (street.length < 1 || canonical.length < 2) return [];

  const areaLabel = area?.trim();
  const locationHint = areaLabel || canonical;
  const params = new URLSearchParams({
    q: `${street} ${locationHint}`,
    limit: String(Math.max(limit, 15)),
  });

  if (cityCenter) {
    params.set("lat", String(cityCenter.lat));
    params.set("lon", String(cityCenter.lng));
  }

  const res = await fetch(`${PHOTON_BASE}?${params}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as PhotonResponse;
  const mapped: AddressSuggestion[] = [];
  const seenStreets = new Set<string>();

  for (const feature of data.features ?? []) {
    if (feature.properties.countrycode && feature.properties.countrycode !== "GR") {
      continue;
    }
    const osmKey = feature.properties.osm_key;
    const osmType = feature.properties.type;
    if (
      osmKey &&
      osmKey !== "highway" &&
      osmType !== "street" &&
      !feature.properties.name?.trim()
    ) {
      continue;
    }
    const item = mapPhotonFeature(feature, canonical, areaLabel);
    if (!item?.street) continue;
    if (!streetMatchesQuery(item.street, street)) continue;
    const key = item.street.toLowerCase();
    if (seenStreets.has(key)) continue;
    seenStreets.add(key);
    mapped.push(item);
  }

  return mapped.slice(0, limit);
}
