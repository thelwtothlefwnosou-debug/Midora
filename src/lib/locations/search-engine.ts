import type { SearchLocation } from "@/lib/data/locations-shared";
import { GREEK_AREA_CATALOG } from "@/lib/data/greek-areas";
import { GREEK_SETTLEMENTS_BY_CITY } from "@/lib/data/greek-settlements.generated";
import {
  GREEK_MAJOR_CITIES_DEDUPED,
  recordMatchesRegion,
  resolveRegionFromQuery,
} from "@/lib/data/greek-cities";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import type { GreeceLocationRecord } from "@/lib/locations/greece-dataset-types";

export const MIN_LOCATION_QUERY_LENGTH = 1;
export const MAX_LOCATION_SUGGESTIONS = 12;

const MIN_MATCH_SCORE = 35;

const CITY_RANK: Record<string, number> = {
  αθηνα: 1,
  θεσσαλονικη: 2,
  πατρα: 3,
  ηρακλειο: 4,
  λαρισα: 5,
  βολος: 6,
  ιωαννινα: 7,
  χανια: 8,
  ροδος: 9,
  πειραιας: 10,
  σαντορινη: 11,
  μυκονος: 12,
  ρεθυμνο: 13,
  "αγιος νικολαος": 14,
  ιεραπετρα: 15,
  σητεια: 16,
  κερκυρα: 17,
  καλαματα: 18,
  καβαλα: 19,
};

function isCorruptedRecord(record: GreeceLocationRecord): boolean {
  return /[,;]/.test(record.nameEl) || /[,;]/.test(record.normalizedName);
}

function isAdministrativeNoise(record: GreeceLocationRecord): boolean {
  if (record.locationType === "region" || record.locationType === "regional_unit") {
    return true;
  }
  if (record.locationType === "municipality" && record.parentCity) {
    return true;
  }
  if (
    record.locationType === "town" &&
    /^(δημοτικη|τοπικη)\s+κοινοτητα/i.test(normalizeLocationQuery(record.nameEl))
  ) {
    return true;
  }
  return false;
}

function isAreaRecord(record: GreeceLocationRecord): boolean {
  return (
    record.locationType === "neighborhood" ||
    record.locationType === "settlement" ||
    record.locationType === "town"
  );
}

/** Collapse genitive municipality forms (Κομοτηνης → κομοτηνη). */
function canonicalPlaceKey(name: string): string {
  let key = normalizeLocationQuery(name);
  if (key.endsWith("σ") && key.length > 4) {
    key = key.slice(0, -1);
  }
  return key;
}

function isRedundantPlaceRecord(record: GreeceLocationRecord): boolean {
  if (!record.parentCity) return false;
  return canonicalPlaceKey(record.nameEl) === canonicalPlaceKey(record.parentCity);
}

function recordPriority(record: GreeceLocationRecord): number {
  if (!record.id.startsWith("elstat-")) return 0;
  if (record.locationType === "city") return 1;
  if (record.locationType === "island") return 2;
  if (record.locationType === "neighborhood") return 3;
  if (record.locationType === "municipality") return 4;
  if (record.locationType === "settlement") return 5;
  return 6;
}

function recordNameStartsWithQuery(record: GreeceLocationRecord, query: string): boolean {
  const q = normalizeLocationQuery(query);
  if (!q) return false;
  if (record.normalizedName.startsWith(q)) return true;
  return record.aliases.some((alias) => alias.startsWith(q));
}

function nameMatchesQuery(record: GreeceLocationRecord, query: string): boolean {
  const q = normalizeLocationQuery(query);
  if (!q) return false;
  if (recordNameStartsWithQuery(record, q)) return true;
  if (q.length <= 2) return false;
  if (record.normalizedName.includes(q)) return true;
  return record.aliases.some((alias) => alias.includes(q));
}

function queryStronglyMatchesCity(query: string, cityName: string): boolean {
  const q = canonicalPlaceKey(query);
  const city = canonicalPlaceKey(cityName);
  return city === q || (city.startsWith(q) && q.length >= 3);
}

function isWizardCityRecord(record: GreeceLocationRecord): boolean {
  if (isCorruptedRecord(record)) return false;
  if (isAdministrativeNoise(record)) return false;
  if (record.parentCity) return false;
  if (record.locationType === "island") return true;
  if (record.locationType === "city") return true;
  if (record.locationType === "municipality") return true;
  if (!record.id.startsWith("elstat-")) return true;
  return false;
}

/** @deprecated Alias — χρησιμοποίησε isWizardCityRecord */
function isMajorCityRecord(record: GreeceLocationRecord): boolean {
  return isWizardCityRecord(record);
}

function isPrimaryPlace(record: GreeceLocationRecord): boolean {
  return (
    record.locationType === "city" ||
    record.locationType === "municipality" ||
    record.locationType === "island"
  );
}

function rankFor(record: GreeceLocationRecord): number {
  const cityKey = normalizeLocationQuery(record.parentCity ?? record.nameEl);
  return CITY_RANK[cityKey] ?? (isPrimaryPlace(record) ? 40 : 55);
}

function scoreMatch(query: string, alias: string): number {
  if (!alias || !query) return 0;
  if (alias === query) return 100;
  if (alias.startsWith(query)) {
    return 95 - Math.min(25, alias.length - query.length);
  }
  if (query.length >= 3 && query.startsWith(alias) && alias.length >= 3) {
    return 72;
  }
  if (query.length >= 3 && alias.includes(query)) {
    return 48 - Math.min(18, alias.length - query.length);
  }
  return 0;
}

function bestScore(query: string, record: GreeceLocationRecord): number {
  let best = scoreMatch(query, record.normalizedName);
  for (const alias of record.aliases) {
    best = Math.max(best, scoreMatch(query, alias));
  }
  if (isPrimaryPlace(record) && record.normalizedName.startsWith(query)) {
    best = Math.max(best, 90 - Math.min(15, record.normalizedName.length - query.length));
  }
  if (!record.id.startsWith("elstat-") && isPrimaryPlace(record)) {
    best += 8;
  }
  return best;
}

export type ResolvedLocation = {
  id: string;
  nameEl: string;
  city: string;
  area?: string;
  district?: string;
  region?: string;
  locationType: GreeceLocationRecord["locationType"];
  strongMatch: boolean;
};

function toSearchLocation(record: GreeceLocationRecord): SearchLocation {
  const isArea =
    record.locationType === "neighborhood" ||
    record.locationType === "settlement" ||
    record.locationType === "town";
  const city = record.parentCity ?? record.nameEl;
  return {
    label: isArea ? `${record.nameEl} · ${city}` : record.nameEl,
    city,
    area: isArea ? record.nameEl : record.area,
    district: record.district ?? record.municipalityName,
    region: record.regionName,
    rank: rankFor(record),
    aliases: record.aliases,
    kind: isArea
      ? "area"
      : record.locationType === "regional_unit"
        ? "district"
        : "city",
  };
}

function sortScoredResults(
  scored: Array<{ record: GreeceLocationRecord; score: number }>,
  query?: string
) {
  const q = query ? normalizeLocationQuery(query) : "";
  return scored.sort((a, b) => {
    if (q) {
      const aPrefix = recordNameStartsWithQuery(a.record, q) ? 0 : 1;
      const bPrefix = recordNameStartsWithQuery(b.record, q) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
    }
    if (b.score !== a.score) return b.score - a.score;
    const priorityDiff = recordPriority(a.record) - recordPriority(b.record);
    if (priorityDiff !== 0) return priorityDiff;
    const aPrimary = isPrimaryPlace(a.record) ? 0 : 1;
    const bPrimary = isPrimaryPlace(b.record) ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return rankFor(a.record) - rankFor(b.record);
  });
}

function resultDedupeKey(record: GreeceLocationRecord): string {
  if (isAreaRecord(record)) {
    return `area:${canonicalPlaceKey(record.nameEl)}:${canonicalPlaceKey(record.parentCity ?? "")}`;
  }
  return `city:${canonicalPlaceKey(record.municipalityName ?? record.nameEl)}`;
}

export function createLocationSearch(dataset: GreeceLocationRecord[]) {
  function searchGreekLocations(
    query: string,
    limit = MAX_LOCATION_SUGGESTIONS
  ): SearchLocation[] {
    const q = normalizeLocationQuery(query);
    if (!q) {
      const seen = new Set<string>();
      const popular: SearchLocation[] = [];
      const primary = dataset
        .filter(
          (l) =>
            isPrimaryPlace(l) &&
            !isCorruptedRecord(l) &&
            !isAdministrativeNoise(l) &&
            !l.parentCity
        )
        .sort((a, b) => recordPriority(a) - recordPriority(b) || rankFor(a) - rankFor(b));

      for (const record of primary) {
        const key = resultDedupeKey(record);
        if (seen.has(key)) continue;
        seen.add(key);
        popular.push(toSearchLocation(record));
        if (popular.length >= limit) break;
      }
      return popular;
    }
    if (q.length < MIN_LOCATION_QUERY_LENGTH) return [];

    const candidates = dataset.filter((record) => {
      if (isCorruptedRecord(record)) return false;
      if (isAdministrativeNoise(record)) return false;
      if (isRedundantPlaceRecord(record)) return false;
      return nameMatchesQuery(record, q);
    });

    const scored = sortScoredResults(
      candidates
        .map((record) => ({
          record,
          score: bestScore(q, record),
        }))
        .filter((s) => s.score >= MIN_MATCH_SCORE),
      q
    );

    const strongCityMatch = scored.some(
      ({ record, score }) =>
        score >= 70 &&
        isPrimaryPlace(record) &&
        queryStronglyMatchesCity(q, record.nameEl)
    );

    const seen = new Set<string>();
    const results: SearchLocation[] = [];
    for (const { record } of scored) {
      const key = resultDedupeKey(record);
      if (seen.has(key)) continue;

      if (strongCityMatch && isAreaRecord(record)) {
        continue;
      }

      seen.add(key);
      results.push(toSearchLocation(record));
      if (results.length >= limit) break;
    }
    return results;
  }

  function resolveLocation(query: string): ResolvedLocation | null {
    const q = normalizeLocationQuery(query.trim());
    if (!q) return null;

    const results = searchGreekLocations(query, 5);
    if (results.length === 0) return null;

    const top = results[0];
    const topRecord = dataset.find(
      (r) =>
        r.nameEl === (top.area ?? top.city) ||
        r.nameEl === top.city ||
        normalizeLocationQuery(r.nameEl) === normalizeLocationQuery(top.area ?? top.city)
    );

    const score = topRecord ? bestScore(q, topRecord) : 0;
    const strongMatch = score >= 70;

    return {
      id: topRecord?.id ?? top.city,
      nameEl: top.area ?? top.city,
      city: top.city,
      area: top.area,
      district: top.district,
      region: top.region,
      locationType: topRecord?.locationType ?? "city",
      strongMatch,
    };
  }

  function isPopularWizardCity(record: GreeceLocationRecord): boolean {
    if (!isWizardCityRecord(record)) return false;
    const key = canonicalPlaceKey(record.nameEl);
    if (key in CITY_RANK) return true;
    return !record.id.startsWith("elstat-");
  }

  function curatedRecordsForRegion(regionLabel: string): GreeceLocationRecord[] {
    return GREEK_MAJOR_CITIES_DEDUPED.filter((c) => recordMatchesRegion(c.region, regionLabel)).map(
      (c) => ({
        id: `curated-city-${normalizeLocationQuery(c.name)}`,
        nameEl: c.name,
        normalizedName: normalizeLocationQuery(c.name),
        locationType: c.type ?? "city",
        regionName: c.region,
        aliases: [
          normalizeLocationQuery(c.name),
          ...(c.aliases?.map(normalizeLocationQuery) ?? []),
        ],
      })
    );
  }

  function recordsForRegion(regionLabel: string): GreeceLocationRecord[] {
    const fromDataset = dataset
      .filter(
        (r) => isWizardCityRecord(r) && recordMatchesRegion(r.regionName, regionLabel)
      )
      .sort((a, b) => rankFor(a) - rankFor(b) || recordPriority(a) - recordPriority(b));

    if (fromDataset.length >= 2) return fromDataset;
    return curatedRecordsForRegion(regionLabel).sort(
      (a, b) => rankFor(a) - rankFor(b) || a.nameEl.localeCompare(b.nameEl, "el")
    );
  }

  function collectCityResults(records: GreeceLocationRecord[], limit: number): SearchLocation[] {
    const seen = new Set<string>();
    const results: SearchLocation[] = [];
    for (const record of records) {
      const key = canonicalPlaceKey(record.nameEl);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(toSearchLocation(record));
      if (results.length >= limit) break;
    }
    return results;
  }

  function searchWizardCitiesOnly(
    query: string,
    limit = MAX_LOCATION_SUGGESTIONS
  ): SearchLocation[] {
    const q = normalizeLocationQuery(query);
    if (!q) {
      const primary = dataset
        .filter((l) => isPopularWizardCity(l))
        .sort((a, b) => rankFor(a) - rankFor(b) || recordPriority(a) - recordPriority(b));
      return collectCityResults(primary, limit);
    }
    if (q.length < MIN_LOCATION_QUERY_LENGTH) return [];

    const candidates = dataset.filter((record) => {
      if (!isWizardCityRecord(record)) return false;
      return nameMatchesQuery(record, q);
    });

    const scored = sortScoredResults(
      candidates
        .map((record) => ({
          record,
          score: bestScore(q, record),
        }))
        .filter(
          (s) =>
            s.score >= MIN_MATCH_SCORE || recordNameStartsWithQuery(s.record, q)
        ),
      q
    );

    const prefixMatches = scored.filter(({ record }) => recordNameStartsWithQuery(record, q));
    if (prefixMatches.length > 0) {
      return collectCityResults(
        prefixMatches.map(({ record }) => record),
        limit
      );
    }

    const regionLabel = resolveRegionFromQuery(q);
    if (regionLabel) {
      return collectCityResults(recordsForRegion(regionLabel), limit);
    }

    return collectCityResults(
      scored.map(({ record }) => record),
      limit
    );
  }

  function searchWizardAreaSuggestions(
    city: string,
    query: string,
    limit = 12
  ): SearchLocation[] {
    const resolved = resolveLocation(city.trim());
    const cityNorm = normalizeLocationQuery(resolved?.city ?? city);
    if (!cityNorm) return [];
    const q = normalizeLocationQuery(query);
    const seen = new Set<string>();
    const results: SearchLocation[] = [];

    function addArea(
      areaName: string,
      district: string | undefined,
      region: string | undefined,
      aliases: string[] = []
    ) {
      const norm = normalizeLocationQuery(areaName);
      if (q && !norm.includes(q) && !aliases.some((a) => a.includes(q) || a.startsWith(q))) {
        return;
      }
      if (seen.has(norm)) return;
      seen.add(norm);
      results.push({
        label: areaName,
        city: resolved?.city ?? city,
        area: areaName,
        district,
        region,
        kind: "area",
        rank: 50,
        aliases,
      });
    }

    for (const entry of GREEK_AREA_CATALOG) {
      if (normalizeLocationQuery(entry.city) !== cityNorm) continue;
      const aliases = (entry.aliases ?? []).map(normalizeLocationQuery);
      addArea(entry.area, entry.district, entry.region, aliases);
      if (results.length >= limit) break;
    }

    if (results.length < limit) {
      const generated = GREEK_SETTLEMENTS_BY_CITY[cityNorm];
      if (generated) {
        for (const areaName of generated) {
          addArea(areaName, undefined, resolved?.region);
          if (results.length >= limit) break;
        }
      }
    }

    if (results.length < limit) {
      for (const record of dataset) {
        if (
          record.locationType !== "neighborhood" &&
          record.locationType !== "settlement" &&
          record.locationType !== "town"
        ) {
          continue;
        }
        if (!record.parentCity || normalizeLocationQuery(record.parentCity) !== cityNorm) {
          continue;
        }
        addArea(record.nameEl, record.district ?? record.municipalityName, record.regionName, record.aliases);
        if (results.length >= limit) break;
      }
    }

    return results.slice(0, limit);
  }

  function searchWizardAreas(city: string, query: string, limit = 12): string[] {
    const cityNorm = normalizeLocationQuery(city);
    const q = normalizeLocationQuery(query);
    const areas = dataset.filter((l) => {
      if (
        l.locationType !== "neighborhood" &&
        l.locationType !== "settlement" &&
        l.locationType !== "town"
      ) {
        return false;
      }
      if (!l.parentCity || normalizeLocationQuery(l.parentCity) !== cityNorm) {
        return false;
      }
      if (!q) return true;
      return l.normalizedName.includes(q) || l.aliases.some((al) => al.includes(q));
    });
    return areas.map((a) => a.nameEl).slice(0, limit);
  }

  function searchWizardCities(query: string, limit = 10): string[] {
    const q = query.trim();
    if (!q) {
      return searchGreekLocations("", limit)
        .map((l) => l.city || l.label)
        .filter((v, i, arr) => arr.indexOf(v) === i);
    }
    const results = searchGreekLocations(q, limit * 2);
    const cities: string[] = [];
    for (const l of results) {
      const name = l.kind === "area" ? l.city : l.city || l.label;
      if (name && !cities.includes(name)) cities.push(name);
      if (cities.length >= limit) break;
    }
    return cities;
  }

  return {
    searchGreekLocations,
    resolveLocation,
    searchWizardAreas,
    searchWizardCities,
    searchWizardCitiesOnly,
    searchWizardAreaSuggestions,
  };
}

export function citiesMatchNormalized(a: string, b: string): boolean {
  const na = normalizeLocationQuery(a);
  const nb = normalizeLocationQuery(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}
