import { GREEK_AREA_CATALOG } from "@/lib/data/greek-areas";
import { GREEK_MUNICIPALITIES } from "@/lib/data/greek-municipalities.generated";
import { GREEK_MAJOR_CITIES_DEDUPED } from "@/lib/data/greek-cities";
import { CANONICAL_LOCATIONS } from "@/lib/locationSearch";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import type { GreeceLocationRecord, GreeceLocationType } from "@/lib/locations/greece-dataset-types";

const EXTRA_CITIES = GREEK_MUNICIPALITIES.map((entry) => {
  const enriched = GREEK_MAJOR_CITIES_DEDUPED.find(
    (c) => normalizeLocationQuery(c.name) === normalizeLocationQuery(entry.name)
  );
  return {
    name: entry.name,
    region: enriched?.region ?? entry.region,
    type: entry.type as GreeceLocationType | undefined,
    aliases: enriched?.aliases ?? [],
  };
});

function slugId(prefix: string, name: string): string {
  return `${prefix}-${normalizeLocationQuery(name).replace(/\s+/g, "-")}`;
}

export function buildCuratedLocationDataset(): GreeceLocationRecord[] {
  const byKey = new Map<string, GreeceLocationRecord>();

  function add(record: GreeceLocationRecord) {
    const key = `${record.locationType}:${record.nameEl}:${record.parentCity ?? ""}`;
    if (!byKey.has(key)) byKey.set(key, record);
  }

  for (const loc of CANONICAL_LOCATIONS) {
    const isNeighborhood = Boolean(loc.area && loc.area !== loc.city);
    add({
      id: loc.id,
      nameEl: isNeighborhood ? loc.area! : loc.label,
      normalizedName: normalizeLocationQuery(isNeighborhood ? loc.area! : loc.label),
      locationType: isNeighborhood ? "neighborhood" : "city",
      regionName: loc.region,
      parentCity: isNeighborhood ? loc.city : undefined,
      area: loc.area,
      district: loc.district,
      aliases: [...loc.aliases],
    });
    if (!isNeighborhood) {
      add({
        id: `city-${loc.id}`,
        nameEl: loc.city,
        normalizedName: normalizeLocationQuery(loc.city),
        locationType: "city",
        regionName: loc.region,
        aliases: [...loc.aliases, normalizeLocationQuery(loc.city)],
      });
    }
  }

  for (const entry of GREEK_AREA_CATALOG) {
    add({
      id: slugId("area", `${entry.city}-${entry.area}`),
      nameEl: entry.area,
      normalizedName: normalizeLocationQuery(entry.area),
      locationType: "neighborhood",
      regionName: entry.region,
      municipalityName: entry.district,
      parentCity: entry.city,
      area: entry.area,
      district: entry.district,
      aliases: [
        normalizeLocationQuery(entry.area),
        ...(entry.aliases?.map(normalizeLocationQuery) ?? []),
      ],
    });
    add({
      id: slugId("city", entry.city),
      nameEl: entry.city,
      normalizedName: normalizeLocationQuery(entry.city),
      locationType: "city",
      regionName: entry.region,
      aliases: [normalizeLocationQuery(entry.city)],
    });
  }

  for (const extra of EXTRA_CITIES) {
    add({
      id: slugId("city", extra.name),
      nameEl: extra.name,
      normalizedName: normalizeLocationQuery(extra.name),
      locationType: extra.type ?? "city",
      regionName: extra.region,
      aliases: [normalizeLocationQuery(extra.name), ...extra.aliases.map(normalizeLocationQuery)],
    });
  }

  return [...byKey.values()];
}

export const CURATED_LOCATION_DATASET = buildCuratedLocationDataset();
