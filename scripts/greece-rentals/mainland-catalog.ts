import { GREEK_AREA_CATALOG, type AreaCatalogEntry } from "../../src/lib/data/greek-areas";

/** Νησιωτικοί δήμοι — εξαιρούνται (θα προστεθούν αργότερα με θέα θάλασσα). */
const ISLAND_CITIES = new Set([
  "Σαντορίνη",
  "Μύκονος",
  "Κέρκυρα",
  "Πάρος",
  "Νάξος",
  "Ζάκυνθος",
  "Κως",
  "Σκιάθος",
  "Κεφαλονιά",
  "Χίος",
  "Λευκάδα",
  "Ρέθυμνο",
  "Ρόδος",
  "Ηράκλειο",
  "Χανιά",
]);

export function getMainlandCatalog(): AreaCatalogEntry[] {
  const seen = new Set<string>();
  const out: AreaCatalogEntry[] = [];
  for (const entry of GREEK_AREA_CATALOG) {
    if (ISLAND_CITIES.has(entry.city)) continue;
    const key = `${entry.city}|${entry.area}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}
