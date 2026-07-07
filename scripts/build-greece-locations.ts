#!/usr/bin/env npx tsx
/**
 * Build Greece location dataset from ELSTAT Kallikratis administrative CSV.
 * Source: eellak/Greek-perfectures-municipalities-settlements-name-directory
 *
 * Run: npx tsx scripts/build-greece-locations.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { GreeceLocationRecord, GreeceLocationType } from "../src/lib/locations/greece-dataset";
import { normalizeLocationQuery } from "../src/lib/locations/normalize";

const ROOT = process.cwd();
const SOURCE_CSV = join(ROOT, "data/source/elstat-kallikratis.csv");
const OUTPUT_JSON = join(ROOT, "src/lib/locations/data/elstat-locations.json");

type ElstatRow = {
  level: number;
  geo: number;
  code: string;
  name: string;
};

const MUNICIPALITY_DISPLAY: Record<string, string> = {
  αθηναιων: "Αθήνα",
  θεσσαλονικησ: "Θεσσαλονίκη",
  πειραιως: "Πειραιάς",
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
};

function parseCsvLine(line: string): ElstatRow | null {
  const parts = line.split(",");
  if (parts.length < 5) return null;
  const idx = Number(parts[0]);
  const level = Number(parts[1]);
  const geo = Number(parts[2]);
  if (!idx || !level) return null;
  const code = parts[3].trim();
  const name = parts.slice(4).join(",").trim();
  if (!name) return null;
  return { level, geo, code, name };
}

function cleanQuotedName(raw: string): string {
  let name = raw.trim();
  if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);
  return name;
}

function cleanElstatName(raw: string): string {
  let name = cleanQuotedName(raw);
  name = name
    .replace(/^ΔΗΜΟΣ\s+/i, "")
    .replace(/^ΔΗΜΟΤΙΚΗ\s+ΕΝΟΤΗΤΑ\s+/i, "")
    .replace(/^ΔΗΜΟΤΙΚΗ\s+ΚΟΙΝΟΤΗΤΑ\s+/i, "")
    .replace(/^ΤΟΠΙΚΗ\s+ΚΟΙΝΟΤΗΤΑ\s+/i, "")
    .replace(/^ΠΕΡΙΦΕΡΕΙΑ\s+/i, "")
    .replace(/^ΠΕΡΙΦΕΡΕΙΑΚΗ\s+ΕΝΟΤΗΤΑ\s+/i, "");
  const articleMatch = name.match(/^(.+?),\s*(η|ο|το|οι|τα)$/i);
  if (articleMatch) name = articleMatch[1].trim();
  return titleCaseGreek(name);
}

function titleCaseGreek(s: string): string {
  if (!s) return s;
  if (s === s.toUpperCase() && /[Α-Ω]/.test(s)) {
    return s
      .toLowerCase()
      .split(/(\s+|-)/)
      .map((part) => {
        if (/^\s+$/.test(part) || part === "-") return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("");
  }
  return s;
}

function municipalityDisplayName(raw: string): string {
  const cleaned = cleanElstatName(raw);
  const norm = normalizeLocationQuery(cleaned);
  return MUNICIPALITY_DISPLAY[norm] ?? cleaned;
}

function regionDisplayName(raw: string): string {
  return titleCaseGreek(
    cleanQuotedName(raw).replace(/^ΠΕΡΙΦΕΡΕΙΑ\s+/i, "").trim()
  );
}

function municipalityCodeFrom(code: string): string | null {
  const digits = code.replace(/\s/g, "");
  if (digits.length < 4) return null;
  return digits.slice(0, 4);
}

function levelToType(level: number): GreeceLocationType {
  switch (level) {
    case 3:
      return "region";
    case 4:
      return "regional_unit";
    case 5:
      return "municipality";
    case 6:
      return "municipality";
    case 7:
      return "town";
    case 8:
      return "settlement";
    default:
      return "settlement";
  }
}

function parseElstatCsv(path: string): ElstatRow[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .slice(5)
    .map(parseCsvLine)
    .filter((r): r is ElstatRow => r !== null);
}

function buildElstatRecords(rows: ElstatRow[]): GreeceLocationRecord[] {
  const records: GreeceLocationRecord[] = [];
  const byKey = new Map<string, GreeceLocationRecord>();

  let currentRegion = "Ελλάδα";
  let currentRegionalUnit = "";
  let currentMunicipalityCode = "";
  let currentMunicipalityName = "";
  const municipalityNames = new Map<string, string>();
  const municipalityRegions = new Map<string, string>();
  const municipalityUnits = new Map<string, string>();
  const seatByMunicipality = new Map<string, string>();

  function add(record: GreeceLocationRecord) {
    const key = `${record.locationType}:${record.normalizedName}:${record.parentCity ?? ""}`;
    if (!byKey.has(key)) {
      byKey.set(key, record);
      records.push(record);
    }
  }

  for (const row of rows) {
    const name = cleanElstatName(row.name);

    if (row.level === 3) {
      currentRegion = regionDisplayName(row.name);
      add({
        id: `elstat-region-${row.geo}`,
        nameEl: currentRegion,
        normalizedName: normalizeLocationQuery(currentRegion),
        locationType: "region",
        regionName: currentRegion,
        aliases: [normalizeLocationQuery(currentRegion)],
      });
      continue;
    }

    if (row.level === 4) {
      currentRegionalUnit = name;
      add({
        id: `elstat-unit-${row.code.trim() || row.geo}`,
        nameEl: name,
        normalizedName: normalizeLocationQuery(name),
        locationType: "regional_unit",
        regionName: currentRegion,
        aliases: [normalizeLocationQuery(name)],
      });
      continue;
    }

    if (row.level === 5) {
      const muniCode = municipalityCodeFrom(row.code);
      if (!muniCode) continue;
      currentMunicipalityCode = muniCode;
      currentMunicipalityName = municipalityDisplayName(row.name);
      municipalityNames.set(muniCode, currentMunicipalityName);
      municipalityRegions.set(muniCode, currentRegion);
      municipalityUnits.set(muniCode, currentRegionalUnit);

      add({
        id: `elstat-muni-${muniCode}`,
        nameEl: currentMunicipalityName,
        normalizedName: normalizeLocationQuery(currentMunicipalityName),
        locationType: "municipality",
        regionName: currentRegion,
        municipalityName: currentMunicipalityName,
        district: currentRegionalUnit,
        aliases: [normalizeLocationQuery(currentMunicipalityName)],
      });
      continue;
    }

    const muniCode = municipalityCodeFrom(row.code);
    if (!muniCode) continue;
    const muniName = municipalityNames.get(muniCode) ?? municipalityDisplayName(row.name);
    const region = municipalityRegions.get(muniCode) ?? currentRegion;
    const unit = municipalityUnits.get(muniCode) ?? currentRegionalUnit;

    if (row.level === 6) {
      add({
        id: `elstat-muniunit-${row.code.trim()}`,
        nameEl: name,
        normalizedName: normalizeLocationQuery(name),
        locationType: "municipality",
        regionName: region,
        municipalityName: muniName,
        parentCity: muniName,
        district: unit,
        aliases: [normalizeLocationQuery(name)],
      });
      continue;
    }

    if (row.level === 7) {
      add({
        id: `elstat-community-${row.code.trim()}`,
        nameEl: name,
        normalizedName: normalizeLocationQuery(name),
        locationType: "town",
        regionName: region,
        municipalityName: muniName,
        parentCity: muniName,
        district: unit,
        aliases: [normalizeLocationQuery(name)],
      });
      continue;
    }

    if (row.level === 8) {
      if (!seatByMunicipality.has(muniCode)) {
        seatByMunicipality.set(muniCode, name);
      }

      const norm = normalizeLocationQuery(name);
      const muniNorm = normalizeLocationQuery(muniName);
      const isSeat = norm === muniNorm || name === seatByMunicipality.get(muniCode);

      add({
        id: `elstat-settlement-${row.code.trim()}`,
        nameEl: name,
        normalizedName: norm,
        locationType: isSeat ? "city" : "settlement",
        regionName: region,
        municipalityName: muniName,
        parentCity: isSeat ? undefined : muniName,
        area: isSeat ? undefined : name,
        district: unit,
        aliases: [norm],
      });
    }
  }

  for (const [muniCode, seatName] of seatByMunicipality) {
    const muniName = municipalityNames.get(muniCode);
    if (!muniName) continue;
    const seatNorm = normalizeLocationQuery(seatName);
    const muniNorm = normalizeLocationQuery(muniName);
    if (seatNorm !== muniNorm) {
      add({
        id: `elstat-muni-alias-${muniCode}`,
        nameEl: seatName,
        normalizedName: seatNorm,
        locationType: "city",
        regionName: municipalityRegions.get(muniCode),
        municipalityName: muniName,
        aliases: [seatNorm, muniNorm],
      });
    }
  }

  return records;
}

function main() {
  if (!existsSync(SOURCE_CSV)) {
    console.error(`Missing ${SOURCE_CSV}`);
    process.exit(1);
  }

  const rows = parseElstatCsv(SOURCE_CSV);
  const records = buildElstatRecords(rows);

  mkdirSync(join(ROOT, "src/lib/locations/data"), { recursive: true });
  writeFileSync(OUTPUT_JSON, JSON.stringify(records));

  const byType: Record<string, number> = {};
  for (const r of records) {
    byType[r.locationType] = (byType[r.locationType] ?? 0) + 1;
  }

  console.log(`Wrote ${records.length} ELSTAT locations to ${OUTPUT_JSON}`);
  console.log(byType);

  execSync("npx tsx scripts/generate-greek-catalog.ts", { stdio: "inherit", cwd: ROOT });
}

main();
