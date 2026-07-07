import "server-only";

import type { ListingFilters } from "@/lib/types";
import { parseListingFilters } from "@/lib/listing-filters";
import type { SavedSearchFilters } from "@/lib/saved-searches";

export function filtersToListingFilters(filters: SavedSearchFilters): ListingFilters {
  return parseListingFilters(filters);
}
