#!/usr/bin/env npx tsx
/**
 * Generate client-safe Greece city + settlement catalogs from ELSTAT JSON.
 * Run automatically after build-greece-locations.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeLocationQuery } from "../src/lib/locations/normalize";
import type { GreeceLocationRecord } from "../src/lib/locations/greece-dataset-types";

const ROOT = process.cwd();
const INPUT = join(ROOT, "src/lib/locations/data/elstat-locations.json");
const MUNI_OUT = join(ROOT, "src/lib/data/greek-municipalities.generated.ts");
const SETTLE_OUT = join(ROOT, "src/lib/data/greek-settlements.generated.ts");

const ISLAND_MUNICIPALITIES = new Set(
  [
    "Κέρκυρα",
    "Ζάκυνθος",
    "Κεφαλονιά",
    "Λευκάδα",
    "Ρόδος",
    "Κως",
    "Κάλυμνος",
    "Μύκονος",
    "Σαντορίνη",
    "Πάρος",
    "Νάξος",
    "Σύρος",
    "Τήνος",
    "Άνδρος",
    "Σκιάθος",
    "Σκόπελος",
    "Χίος",
    "Σάμος",
    "Λήμνος",
    "Λέσβος",
    "Μυτιλήνη",
    "Ίος",
    "Μήλος",
    "Κάρπαθος",
    "Κάσος",
    "Άστυπαλαα",
    "Λέρος",
    "Πάτμος",
    "Ικαρία",
    "Φολέγανδρος",
    "Σίφνος",
    "Σέριφος",
    "Κύθνος",
    "Κίμωλος",
    "Αμοργός",
    "Άγιος Ευστράτιος",
    "Ψαρά",
    "Οινούσσες",
    "Θήρα",
  ].map(normalizeLocationQuery)
);

/** Genitive → nominative display names (ELSTAT → UX). */
const MUNICIPALITY_DISPLAY: Record<string, string> = {
  αθηναιων: "Αθήνα",
  θεσσαλονικησ: "Θεσσαλονίκη",
  πειραιως: "Πειραιάς",
  πειραιωσ: "Πειραιάς",
  ηρακλειου: "Ηράκλειο",
  πατρεων: "Πάτρα",
  λαρισαιων: "Λάρισα",
  βολου: "Βόλος",
  ιωαννινων: "Ιωάννινα",
  χανιων: "Χανιά",
  ροδου: "Ρόδος",
  κομοτηνησ: "Κομοτηνή",
  καβαλασ: "Καβάλα",
  κοζανησ: "Κοζάνη",
  τρικαλεων: "Τρίκαλα",
  καλαματασ: "Καλαμάτα",
  αλεξανδρουπολεως: "Αλεξανδρούπολη",
  κερκυρασ: "Κέρκυρα",
  συρου: "Σύρος",
  μυκονου: "Μύκονος",
  θηρασ: "Σαντορίνη",
  ναξου: "Νάξος",
  παρου: "Πάρος",
  αγρινιου: "Αγρίνιο",
  σερρων: "Σέρρες",
  κατερινησ: "Κατερίνη",
  χαλκιδασ: "Χαλκίδα",
  λαμιασ: "Λαμία",
  ξανθησ: "Ξάνθη",
  δραμασ: "Δράμα",
  φλωρινασ: "Φλώρινα",
  γρεβενων: "Γρεβενά",
  καστοριασ: "Καστοριά",
  κορινθιων: "Κόρινθος",
  αργουσ: "Άργος",
  τριπολεως: "Τρίπολη",
  σπαρτησ: "Σπάρτη",
  ναυπλιου: "Ναύπλιο",
  πυργου: "Πύργος",
  μεσολογγιου: "Μεσολόγγι",
  πρεβεζησ: "Πρέβεζα",
  αρτασ: "Άρτα",
  χιου: "Χίος",
  μυτιληνησ: "Μυτιλήνη",
  σαμου: "Σάμος",
  λημνου: "Λήμνος",
  ζακυνθου: "Ζάκυνθος",
  κεφαλληνιασ: "Κεφαλονιά",
  λευκαδασ: "Λευκάδα",
  κω: "Κως",
  "αγιου νικολαου": "Άγιος Νικόλαος",
  ρεθυμνησ: "Ρέθυμνο",
  ιεραπετρασ: "Ιεράπετρα",
  σητειασ: "Σητεία",
  πτολεμαΐδασ: "Πτολεμαΐδα",
  πτολεμαιδασ: "Πτολεμαΐδα",
  βεροιασ: "Βέροια",
  κιλκισ: "Κιλκίς",
  εδεσσασ: "Έδεσσα",
  πολυγυρου: "Πολύγυρος",
  ναουσασ: "Ναούσα",
  καρδιτσασ: "Καρδίτσα",
  λιβαδειασ: "Λιβαδειά",
  ορεστιαδασ: "Ορεστιάδα",
  γιαννιτσασ: "Γιαννιτσά",
  αβδηρων: "Άβδηρα",
  "αγιου βασιλειου": "Άγιος Βασίλειος",
};

function escapeTs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function municipalityDisplayName(raw: string): string {
  const norm = normalizeLocationQuery(raw);
  return MUNICIPALITY_DISPLAY[norm] ?? raw;
}

const REGION_DISPLAY: Record<string, string> = {
  "ανατολικησ μακεδονιασ και θρακησ": "Ανατολική Μακεδονία και Θράκη",
  αττικησ: "Αττική",
  "βορειου αιγαιου": "Βόρειο Αιγαίο",
  "δυτικησ ελλαδασ": "Δυτική Ελλάδα",
  "δυτικησ μακεδονιασ": "Δυτική Μακεδονία",
  ηπειρου: "Ήπειρος",
  θεσσαλιασ: "Θεσσαλία",
  "ιονιων νησων": "Ιόνια Νησιά",
  "κεντρικησ μακεδονιασ": "Κεντρική Μακεδονία",
  κρητησ: "Κρήτη",
  "νοτιου αιγαιου": "Νότιο Αιγαίο",
  πελοποννησου: "Πελοπόννησος",
  "στερεασ ελλαδασ": "Στερεά Ελλάδα",
  "αγιο ορος αυτοδιοικητο": "Άγιο Όρος (Αυτοδιοίκητο)",
};

function regionDisplayName(raw: string | undefined): string {
  if (!raw) return "Ελλάδα";
  const norm = normalizeLocationQuery(raw);
  return REGION_DISPLAY[norm] ?? raw;
}

function isAdminNoise(name: string): boolean {
  const n = normalizeLocationQuery(name);
  return (
    n.startsWith("δημοτικη κοινοτητα") ||
    n.startsWith("τοπικη κοινοτητα") ||
    n.includes(",") ||
    n.includes(";") ||
    n.includes("δ δ") ||
    n.includes("νησις") ||
    n.includes("νησί") ||
    /\(τ\./.test(name)
  );
}

function cleanSettlementName(name: string): string | null {
  if (isAdminNoise(name)) return null;
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;
  return trimmed;
}

export function generateGreekCatalog(): { municipalities: number; citiesWithAreas: number; totalAreas: number } {
  const records = JSON.parse(readFileSync(INPUT, "utf8")) as GreeceLocationRecord[];

  const municipalities = new Map<
    string,
    { name: string; region: string; district: string; type: "city" | "island" }
  >();

  for (const r of records) {
    if (r.locationType !== "municipality" || r.parentCity) continue;
    const key = normalizeLocationQuery(r.nameEl);
    if (municipalities.has(key)) continue;
    const isIsland = ISLAND_MUNICIPALITIES.has(key);
    municipalities.set(key, {
      name: municipalityDisplayName(r.nameEl),
      region: regionDisplayName(r.regionName),
      district: r.district ?? "",
      type: isIsland ? "island" : "city",
    });
  }

  const settlementsByCity = new Map<string, Set<string>>();

  function addSettlement(cityName: string, areaName: string) {
    const cleaned = cleanSettlementName(areaName);
    if (!cleaned) return;
    const cityKey = normalizeLocationQuery(cityName);
    const areaKey = normalizeLocationQuery(cleaned);
    if (areaKey === cityKey) return;
    if (!settlementsByCity.has(cityKey)) settlementsByCity.set(cityKey, new Set());
    settlementsByCity.get(cityKey)!.add(cleaned);
  }

  function resolveParentCity(r: GreeceLocationRecord): string | null {
    const raw = r.parentCity ?? r.municipalityName;
    if (!raw) return null;
    return municipalityDisplayName(raw);
  }

  for (const r of records) {
    if (r.locationType === "town" || r.locationType === "settlement") {
      const parent = resolveParentCity(r);
      if (parent) addSettlement(parent, r.nameEl);
      continue;
    }
    if (r.locationType === "city") {
      const parent = resolveParentCity(r);
      if (!parent) continue;
      if (normalizeLocationQuery(r.nameEl) === normalizeLocationQuery(parent)) continue;
      addSettlement(parent, r.nameEl);
    }
  }

  const muniLines = [...municipalities.values()]
    .sort((a, b) => a.name.localeCompare(b.name, "el"))
    .map(
      (m) =>
        `  { name: "${escapeTs(m.name)}", region: "${escapeTs(m.region)}", type: "${m.type}" as const },`
    );

  writeFileSync(
    MUNI_OUT,
    `/** AUTO-GENERATED — scripts/generate-greek-catalog.ts — do not edit */\n\nexport type GeneratedMunicipality = {\n  name: string;\n  region: string;\n  type: "city" | "island";\n};\n\n/** Όλοι οι δήμοι Ελλάδας (ELSTAT Kallikratis) — ${municipalities.size} εγγραφές */\nexport const GREEK_MUNICIPALITIES: GeneratedMunicipality[] = [\n${muniLines.join("\n")}\n];\n`
  );

  const settleEntries: string[] = [];
  let totalAreas = 0;
  for (const [cityKey, areas] of [...settlementsByCity.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const sorted = [...areas].sort((a, b) => a.localeCompare(b, "el"));
    totalAreas += sorted.length;
    const items = sorted.map((a) => `"${escapeTs(a)}"`).join(", ");
    settleEntries.push(`  "${cityKey}": [${items}],`);
  }

  writeFileSync(
    SETTLE_OUT,
    `/** AUTO-GENERATED — scripts/generate-greek-catalog.ts — do not edit */\n\n/** Οικισμοί/κοινότητες ανά δήμο (κλειδί = normalizeLocationQuery(πόλη)) */\nexport const GREEK_SETTLEMENTS_BY_CITY: Record<string, string[]> = {\n${settleEntries.join("\n")}\n};\n`
  );

  return {
    municipalities: municipalities.size,
    citiesWithAreas: settlementsByCity.size,
    totalAreas,
  };
}

const stats = generateGreekCatalog();
console.log(
  `Generated ${stats.municipalities} municipalities, ${stats.citiesWithAreas} cities with ${stats.totalAreas} settlements/areas`
);
