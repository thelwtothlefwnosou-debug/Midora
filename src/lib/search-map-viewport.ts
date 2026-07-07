import type { MapBounds } from "@/lib/geo/polygon";
import { polygonCentroid, polygonFitZoom } from "@/lib/geo/polygon";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import type { ResolvedLocation } from "@/lib/locations/search-server";
import type { ListingWithImages } from "@/lib/types";

/** Default: all of Greece, not Europe/world. */
export const GREECE_MAP_VIEW = {
  center: { lat: 39.1, lng: 22.4 },
  zoom: 6,
} as const;

type LocationViewport = {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: MapBounds;
};

const LOCATION_VIEWPORTS: Record<string, LocationViewport> = {
  αθηνα: { center: { lat: 37.9838, lng: 23.7275 }, zoom: 12 },
  θεσσαλονικη: { center: { lat: 40.6401, lng: 22.9444 }, zoom: 12 },
  πατρα: { center: { lat: 38.2466, lng: 21.7346 }, zoom: 12 },
  ηρακλειο: { center: { lat: 35.3387, lng: 25.1442 }, zoom: 12 },
  λαρισα: { center: { lat: 39.639, lng: 22.4191 }, zoom: 12 },
  βολος: { center: { lat: 39.3619, lng: 22.9425 }, zoom: 12 },
  ιωαννινα: { center: { lat: 39.665, lng: 20.8537 }, zoom: 12 },
  χανια: { center: { lat: 35.5138, lng: 24.018 }, zoom: 12 },
  ρεθυμνο: { center: { lat: 35.3662, lng: 24.4824 }, zoom: 12 },
  σαντορινη: { center: { lat: 36.3932, lng: 25.4615 }, zoom: 11 },
  μυκονος: { center: { lat: 37.4467, lng: 25.3289 }, zoom: 12 },
  ροδος: { center: { lat: 36.4341, lng: 28.2176 }, zoom: 11 },
  κερκυρα: { center: { lat: 39.6243, lng: 19.9217 }, zoom: 11 },
  καλαματα: { center: { lat: 37.0385, lng: 22.1142 }, zoom: 12 },
  καβαλα: { center: { lat: 40.9393, lng: 24.4069 }, zoom: 12 },
  πειραιας: { center: { lat: 37.942, lng: 23.646 }, zoom: 13 },
  χαλκιδικη: {
    center: { lat: 40.25, lng: 23.45 },
    zoom: 10,
    bounds: { north: 40.55, south: 39.95, east: 24.1, west: 22.9 },
  },
  κρητη: {
    center: { lat: 35.2, lng: 24.9 },
    zoom: 8,
    bounds: { north: 35.7, south: 34.8, east: 26.35, west: 23.45 },
  },
  αττικη: {
    center: { lat: 38.05, lng: 23.85 },
    zoom: 10,
    bounds: { north: 38.35, south: 37.75, east: 24.1, west: 23.35 },
  },
};

export type SearchMapViewport = {
  center: { lat: number; lng: number };
  zoom: number;
  initialBounds?: MapBounds;
  fitToMarkers: boolean;
  fitMaxZoom: number;
  fitMinZoom: number;
};

export type SearchMapContext = {
  polygon?: { lat: number; lng: number }[];
  nearby?: { lat: number; lng: number };
  bounds?: MapBounds;
  city?: string;
  area?: string;
  district?: string;
  resolvedLocation?: ResolvedLocation | null;
};

function lookupLocationViewport(
  ...labels: (string | undefined | null)[]
): LocationViewport | null {
  for (const label of labels) {
    if (!label?.trim()) continue;
    const key = normalizeLocationQuery(label);
    if (LOCATION_VIEWPORTS[key]) return LOCATION_VIEWPORTS[key];
    for (const [k, v] of Object.entries(LOCATION_VIEWPORTS)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
  }
  return null;
}

function listingsWithCoords(listings: ListingWithImages[]) {
  return listings.filter(
    (l) =>
      l.latitude != null &&
      l.longitude != null &&
      Number.isFinite(l.latitude) &&
      Number.isFinite(l.longitude)
  );
}

/** Keep map markers aligned with the active location filter when possible. */
export function filterListingsForMapDisplay(
  listings: ListingWithImages[],
  context: SearchMapContext
): ListingWithImages[] {
  const withCoords = listingsWithCoords(listings);
  if (withCoords.length === 0) return withCoords;

  const locationLabels = [
    context.district,
    context.area,
    context.resolvedLocation?.area,
    context.resolvedLocation?.nameEl,
    context.city,
    context.resolvedLocation?.city,
  ].filter(Boolean) as string[];

  if (locationLabels.length === 0 && !context.bounds && !context.polygon) {
    return withCoords;
  }

  if (context.bounds) {
    const b = context.bounds;
    return withCoords.filter(
      (l) =>
        l.latitude! <= b.north &&
        l.latitude! >= b.south &&
        l.longitude! <= b.east &&
        l.longitude! >= b.west
    );
  }

  if (locationLabels.length === 0) return withCoords;

  const keys = locationLabels.map((l) => normalizeLocationQuery(l));
  return withCoords.filter((l) => {
    const cityKey = normalizeLocationQuery(l.city ?? "");
    const areaKey = normalizeLocationQuery(l.area ?? "");
    return keys.some(
      (k) =>
        cityKey === k ||
        areaKey === k ||
        cityKey.includes(k) ||
        areaKey.includes(k) ||
        k.includes(cityKey) ||
        k.includes(areaKey)
    );
  });
}

export function resolveSearchMapViewport(
  context: SearchMapContext,
  listings: ListingWithImages[]
): SearchMapViewport {
  const coords = listingsWithCoords(listings);
  const hasLocationContext = Boolean(
    context.polygon?.length ||
      context.bounds ||
      context.nearby ||
      context.city ||
      context.area ||
      context.district ||
      context.resolvedLocation
  );

  if (context.polygon && context.polygon.length >= 3) {
    return {
      center: polygonCentroid(context.polygon),
      zoom: polygonFitZoom(context.polygon),
      fitToMarkers: false,
      fitMaxZoom: 14,
      fitMinZoom: 10,
    };
  }

  if (context.bounds) {
    const b = context.bounds;
    return {
      center: {
        lat: (b.north + b.south) / 2,
        lng: (b.east + b.west) / 2,
      },
      zoom: 13,
      initialBounds: b,
      fitToMarkers: false,
      fitMaxZoom: 14,
      fitMinZoom: 10,
    };
  }

  if (context.nearby) {
    return {
      center: { lat: context.nearby.lat, lng: context.nearby.lng },
      zoom: 13,
      fitToMarkers: coords.length > 0,
      fitMaxZoom: 14,
      fitMinZoom: 11,
    };
  }

  const locationViewport = lookupLocationViewport(
    context.district,
    context.area,
    context.resolvedLocation?.area,
    context.resolvedLocation?.nameEl,
    context.city,
    context.resolvedLocation?.city,
    context.resolvedLocation?.region
  );

  if (locationViewport) {
    if (locationViewport.bounds) {
      return {
        center: locationViewport.center,
        zoom: locationViewport.zoom,
        initialBounds: locationViewport.bounds,
        fitToMarkers: coords.length > 0,
        fitMaxZoom: 14,
        fitMinZoom: locationViewport.zoom,
      };
    }

    return {
      center: locationViewport.center,
      zoom: locationViewport.zoom,
      fitToMarkers: coords.length > 0,
      fitMaxZoom: 14,
      fitMinZoom: Math.max(10, locationViewport.zoom - 1),
    };
  }

  if (hasLocationContext) {
    return {
      center: GREECE_MAP_VIEW.center,
      zoom: 8,
      fitToMarkers: coords.length > 0,
      fitMaxZoom: 13,
      fitMinZoom: 9,
    };
  }

  if (coords.length > 0) {
    return {
      ...GREECE_MAP_VIEW,
      fitToMarkers: false,
      fitMaxZoom: 8,
      fitMinZoom: 6,
    };
  }

  return {
    ...GREECE_MAP_VIEW,
    fitToMarkers: false,
    fitMaxZoom: 8,
    fitMinZoom: 6,
  };
}
