export type LatLng = { lat: number; lng: number };

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

const MIN_POINTS = 3;
const CLOSE_DISTANCE_METERS = 60;

/** Minimum spacing while freehand-drawing (meters). */
export const POLYGON_STROKE_MIN_METERS = 20;

/** Encode polygon for URL: `lat,lng;lat,lng;...` */
export function encodePolygonParam(points: LatLng[]): string {
  return points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
}

/** Parse polygon from URL param */
export function parsePolygonParam(raw: string | undefined): LatLng[] | undefined {
  if (!raw?.trim()) return undefined;

  const points: LatLng[] = [];
  for (const part of raw.split(";")) {
    const [latStr, lngStr] = part.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    points.push({ lat, lng });
  }

  return points.length >= MIN_POINTS ? points : undefined;
}

/** Ray-casting point-in-polygon (WGS84, flat approximation) */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < MIN_POINTS) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 38.5, lng: 23.7 };

  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / points.length, lng: lng / points.length };
}

export function polygonBounds(points: LatLng[]) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

/** Approximate zoom to fit polygon in view */
export function polygonFitZoom(points: LatLng[]): number {
  const { minLat, maxLat, minLng, maxLng } = polygonBounds(points);
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const span = Math.max(latSpan, lngSpan);

  if (span > 2) return 8;
  if (span > 1) return 9;
  if (span > 0.5) return 10;
  if (span > 0.2) return 11;
  if (span > 0.1) return 12;
  if (span > 0.05) return 13;
  if (span > 0.02) return 14;
  return 15;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isNearFirstPoint(
  point: LatLng,
  first: LatLng,
  zoom: number
): boolean {
  const zoomFactor = zoom >= 15 ? 1 : zoom >= 13 ? 1.35 : zoom >= 11 ? 1.75 : 2.25;
  return haversineMeters(point, first) <= CLOSE_DISTANCE_METERS * zoomFactor;
}

/** Reduce freehand stroke to a manageable polygon for URLs and hit-testing. */
export function simplifyPolygon(points: LatLng[], maxPoints = 20): LatLng[] {
  if (points.length <= maxPoints) return [...points];

  const result: LatLng[] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(points.length - 1, Math.round(i * step));
    result.push(points[idx]);
  }
  return result;
}

export const POLYGON_MIN_POINTS = MIN_POINTS;
