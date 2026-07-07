import "server-only";

import { GREECE_LOCATION_DATASET } from "@/lib/locations/greece-dataset";
import {
  createLocationSearch,
  MIN_LOCATION_QUERY_LENGTH,
  MAX_LOCATION_SUGGESTIONS,
  citiesMatchNormalized,
  type ResolvedLocation,
} from "@/lib/locations/search-engine";

const search = createLocationSearch(GREECE_LOCATION_DATASET);

export {
  MIN_LOCATION_QUERY_LENGTH,
  MAX_LOCATION_SUGGESTIONS,
  citiesMatchNormalized,
  type ResolvedLocation,
};

export const searchGreekLocations = search.searchGreekLocations;
export const resolveLocation = search.resolveLocation;
export const searchWizardAreas = search.searchWizardAreas;
export const searchWizardCities = search.searchWizardCities;
export const searchWizardCitiesOnly = search.searchWizardCitiesOnly;
export const searchWizardAreaSuggestions = search.searchWizardAreaSuggestions;
