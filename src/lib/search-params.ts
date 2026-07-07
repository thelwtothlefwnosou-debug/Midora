import type { SearchLocation } from "@/lib/data/locations-shared";
import { encodePolygonParam } from "@/lib/geo/polygon";
import type { LatLng } from "@/lib/geo/polygon";

export function appendLocationToParams(
  params: URLSearchParams,
  options: {
    location?: SearchLocation | null;
    nearby?: { lat: number; lng: number; radiusKm?: number } | null;
    polygon?: LatLng[] | string | null;
    cityText?: string;
  }
) {
  const { location, nearby, polygon, cityText } = options;

  params.delete("city");
  params.delete("area");
  params.delete("district");
  params.delete("nearby");
  params.delete("polygon");
  params.delete("bounds");

  if (polygon) {
    const encoded =
      typeof polygon === "string" ? polygon : encodePolygonParam(polygon);
    params.set("polygon", encoded);
    return;
  }

  if (nearby) {
    params.set(
      "nearby",
      `${nearby.lat},${nearby.lng},${nearby.radiusKm ?? 8}`
    );
    return;
  }

  if (location) {
    if (location.kind === "nearby") return;
    if (location.city) params.set("city", location.city);
    if (location.kind === "district" && location.district) {
      params.set("district", location.district);
    } else if (location.area) {
      params.set("area", location.area);
      if (location.district) params.set("district", location.district);
    }
    return;
  }

  if (cityText?.trim()) {
    params.set("city", cityText.trim());
  }
}

export function appendBoundsToParams(
  params: URLSearchParams,
  bounds: { north: number; south: number; east: number; west: number }
) {
  params.set(
    "bounds",
    `${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
  );
}
