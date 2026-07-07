/** Vector basemap — OpenFreeMap (no Mapbox/Google fees). */
export const MIDORA_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/** Alternate light style if liberty needs swapping during QA. */
export const MIDORA_MAP_STYLE_ALT = "https://tiles.openfreemap.org/styles/bright";

export const MAP_ATTRIBUTION =
  '© <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

export const DEFAULT_MAP_LOCALE = "el";

/** Wheel / pinch limit — overzooms vector tiles for building-level detail. */
export const MIDORA_MAP_MAX_ZOOM = 20;

/** Zoom when focusing a single listing (search map click, confirmed pin). */
export const MIDORA_MAP_LISTING_FOCUS_ZOOM = 18;

/** Default zoom for approximate public area (privacy circle). */
export const MIDORA_MAP_APPROX_ZOOM = 14;

export const MIDORA_MAP_MIN_ZOOM = 5;
