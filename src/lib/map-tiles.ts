/** Leaflet wizard/draw maps only — production search & detail use MapLibre + OpenFreeMap. */
export const MAP_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export const MAP_TILE_SUBDOMAINS = ["a", "b", "c", "d"] as const;

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function getMapTileUrl(): string {
  return MAP_TILE_URL;
}

export function getMapTileAttribution(): string {
  return MAP_TILE_ATTRIBUTION;
}
