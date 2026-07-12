import type { Map as MaplibreMap } from "maplibre-gl";

/** Hide place/street labels on listing detail maps for a cleaner approximate area view. */
export function hideMapTextLabels(map: MaplibreMap) {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    const layout = layer.layout as { "text-field"?: unknown } | undefined;
    if (!layout?.["text-field"]) continue;
    try {
      map.setLayoutProperty(layer.id, "visibility", "none");
    } catch {
      /* some layers may not accept visibility changes */
    }
  }
}
