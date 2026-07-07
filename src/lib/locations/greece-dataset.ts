import "server-only";

import elstatLocations from "@/lib/locations/data/elstat-locations.json";
import { buildCuratedLocationDataset } from "@/lib/locations/greece-dataset-curated";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import type { GreeceLocationRecord } from "@/lib/locations/greece-dataset-types";

function mergeAliases(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

function buildDataset(): GreeceLocationRecord[] {
  const byKey = new Map<string, GreeceLocationRecord>();

  function add(record: GreeceLocationRecord) {
    const key = `${record.locationType}:${record.normalizedName}:${record.parentCity ?? ""}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, record);
      return;
    }
    byKey.set(key, {
      ...existing,
      aliases: mergeAliases(existing.aliases, record.aliases),
      regionName: existing.regionName ?? record.regionName,
      district: existing.district ?? record.district,
      municipalityName: existing.municipalityName ?? record.municipalityName,
    });
  }

  for (const loc of elstatLocations as GreeceLocationRecord[]) {
    add(loc);
  }
  for (const loc of buildCuratedLocationDataset()) {
    add(loc);
  }

  return [...byKey.values()];
}

export type { GreeceLocationRecord, GreeceLocationType } from "@/lib/locations/greece-dataset-types";

export const GREECE_LOCATION_DATASET: GreeceLocationRecord[] = buildDataset();

export const GREECE_LOCATION_BY_NORMALIZED = new Map(
  GREECE_LOCATION_DATASET.map((l) => [l.normalizedName, l])
);

export function getAreasForCityFromDataset(city: string, limit = 50): GreeceLocationRecord[] {
  const cityNorm = normalizeLocationQuery(city);
  return GREECE_LOCATION_DATASET.filter(
    (l) =>
      (l.locationType === "neighborhood" ||
        l.locationType === "settlement" ||
        l.locationType === "town") &&
      l.parentCity &&
      normalizeLocationQuery(l.parentCity) === cityNorm
  ).slice(0, limit);
}
