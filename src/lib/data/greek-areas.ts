/**
 * Περιοχές & δήμοι Ελλάδας — Spitogatos-style hierarchy.
 * city → district (π.χ. «Αθήνα - Κέντρο») → area (γειτονιά)
 */

import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { GREEK_SETTLEMENTS_BY_CITY } from "@/lib/data/greek-settlements.generated";

export type AreaCatalogEntry = {
  city: string;
  district: string;
  region: string;
  area: string;
  aliases?: string[];
};

type DistrictDef = {
  district: string;
  region: string;
  areas: string[];
  areaAliases?: Record<string, string[]>;
};

function areasForCity(city: string, districts: DistrictDef[]): AreaCatalogEntry[] {
  const out: AreaCatalogEntry[] = [];
  for (const d of districts) {
    for (const area of d.areas) {
      out.push({
        city,
        district: d.district,
        region: d.region,
        area,
        aliases: d.areaAliases?.[area],
      });
    }
  }
  return out;
}

const ATHENS: DistrictDef[] = [
  {
    district: "Αθήνα - Κέντρο",
    region: "Αττική",
    areas: [
      "Κουκάκι",
      "Παγκράτι",
      "Εξάρχεια",
      "Ψυρρή",
      "Πλάκα",
      "Μοναστηράκι",
      "Θησείο",
      "Κολωνάκι",
      "Σύνταγμα",
      "Μετς",
      "Νεάπολη",
      "Ιλίσια",
      "Γκύζη",
      "Αμπελόκηποι",
      "Πατήσια",
    ],
  },
  {
    district: "Αθήνα - Βόρεια Προάστια",
    region: "Αττική",
    areas: [
      "Κηφισιά",
      "Χαλάνδρι",
      "Μαρούσι",
      "Βριλήσσια",
      "Μελίσσια",
      "Πεντέλη",
      "Φιλοθέη",
      "Ψυχικό",
      "Αγία Παρασκευή",
      "Χολαργός",
      "Παπάγου",
      "Μεταμόρφωση",
      "Νέα Ιωνία",
      "Ηράκλειο Αττικής",
    ],
  },
  {
    district: "Αθήνα - Νότια Προάστια",
    region: "Αττική",
    areas: [
      "Γλυφάδα",
      "Βούλα",
      "Βουλιαγμένη",
      "Άλιμος",
      "Ελληνικό",
      "Αργυρούπολη",
      "Άγιος Δημήτριος",
      "Νέα Σμύρνη",
      "Καλλιθέα",
      "Μοσχάτο",
      "Ταύρος",
      "Παλαιό Φάληρο",
    ],
  },
  {
    district: "Αθήνα - Δυτικά Προάστια",
    region: "Αττική",
    areas: [
      "Περιστέρι",
      "Αιγάλεω",
      "Ίλιον",
      "Πετρούπολη",
      "Χαϊδάρι",
      "Αγία Βαρβάρα",
      "Νίκαια",
      "Κορυδαλλός",
      "Άγιοι Ανάργυροι",
    ],
  },
  {
    district: "Αθήνα - Ανατολικά Προάστια",
    region: "Αττική",
    areas: [
      "Ζωγράφου",
      "Καισαριανή",
      "Βύρωνας",
      "Χαλάνδρι",
      "Γέρακας",
      "Παλλήνη",
      "Αγία Παρασκευή",
      "Δάφνη",
      "Υμηττός",
    ],
  },
  {
    district: "Πειραιάς",
    region: "Αττική",
    areas: ["Κέντρο Πειραιά", "Καλλίπολη", "Νίκαια", "Δραπετσώνα", "Κερατσίνι"],
  },
];

const THESSALONIKI: DistrictDef[] = [
  {
    district: "Θεσσαλονίκη - Κέντρο",
    region: "Κεντρική Μακεδονία",
    areas: ["Λαδάδικα", "Τσιμισκή", "Καμάρα", "Ροτόντα", "Άνω Πόλη", "Κουκάκι Θεσσαλονίκης"],
  },
  {
    district: "Θεσσαλονίκη - Νότια",
    region: "Κεντρική Μακεδονία",
    areas: ["Καλαμαριά", "Περαία", "Νέα Κρήνη", "Νέα Παραλία", "Αρέτουσα"],
  },
  {
    district: "Θεσσαλονίκη - Δυτικά",
    region: "Κεντρική Μακεδονία",
    areas: ["Εύοσμος", "Σταυρούπολη", "Νεάπολη", "Αμπελόκηποι Θεσσαλονίκης", "Μενεμένη"],
  },
  {
    district: "Θεσσαλονίκη - Ανατολικά",
    region: "Κεντρική Μακεδονία",
    areas: ["Πυλαία", "Θέρμη", "Πανόραμα", "Χαριλάου", "Τούμπα"],
  },
];

const PATRA: DistrictDef[] = [
  {
    district: "Πάτρα - Κέντρο",
    region: "Δυτική Ελλάδα",
    areas: ["Κέντρο", "Άνω Πόλη", "Ψηλαλώνια", "Αγυιά"],
  },
  {
    district: "Πάτρα - Προάστια",
    region: "Δυτική Ελλάδα",
    areas: ["Ρίο", "Προάστεια", "Γλαύκος", "Βούα"],
  },
];

const HERAKLION: DistrictDef[] = [
  {
    district: "Ηράκλειο - Κέντρο",
    region: "Κρήτη",
    areas: ["Κέντρο", "Λιμάνι", "Καμίνια", "Πόρτο Ράφτη"],
  },
  {
    district: "Ηράκλειο - Προάστια",
    region: "Κρήτη",
    areas: ["Κνωσός", "Αμμουδάρα", "Γιοφύρο", "Αλικαρνασσός"],
  },
];

const LARISSA: DistrictDef[] = [
  {
    district: "Λάρισα - Κέντρο",
    region: "Θεσσαλία",
    areas: ["Κέντρο", "Φιλippάπολη", "Αβέρωφ", "Νεάπολη Λάρισας"],
  },
];

const VOLOS: DistrictDef[] = [
  {
    district: "Βόλος - Κέντρο",
    region: "Θεσσαλία",
    areas: ["Κέντρο", "Νέα Ιωνία Βόλου", "Παλιά", "Νέα Μαγνησία"],
  },
];

const IOANNINA: DistrictDef[] = [
  {
    district: "Ιωάννινα - Κέντρο",
    region: "Ήπειρος",
    areas: ["Κέντρο", "Κατσικά", "Αγία Μαρίνα", "Νεοχώρι"],
  },
];

const CHANIA: DistrictDef[] = [
  {
    district: "Χανιά - Κέντρο",
    region: "Κρήτη",
    areas: ["Παλιά Πόλη", "Νεάπολη Χανίων", "Κουμπές", "Μάλεμε"],
  },
  {
    district: "Χανιά - Προάστια",
    region: "Κρήτη",
    areas: ["Πλατανιάς", "Αγία Μαρίνα Χανίων", "Κολυμβάρι"],
  },
];

const RHODES: DistrictDef[] = [
  {
    district: "Ρόδος - Κέντρο",
    region: "Νότιο Αιγαίο",
    areas: ["Παλιά Πόλη", "Νέα Πόλη", "Ιξιά", "Φαληράκι"],
  },
];

const ISLANDS: { city: string; region: string; areas: string[] }[] = [
  { city: "Σαντορίνη", region: "Νότιο Αιγαίο", areas: ["Οία", "Φηρά", "Ημεροβίγλι", "Καμάρι", "Ακρωτήρι"] },
  { city: "Μύκονος", region: "Νότιο Αιγαίο", areas: ["Χώρα", "Ορνός", "Άγιος Στέφανος", "Πλατις Γιαλός"] },
  { city: "Κέρκυρα", region: "Ιόνια Νησιά", areas: ["Κέντρο", "Γαρίτsa", "Κανόνι", "Μπενίτσες", "Παλαιοκαστρίτσα"] },
  { city: "Πάρος", region: "Νότιο Αιγαίο", areas: ["Παροικιά", "Νάουσα", "Λεφκές"] },
  { city: "Νάξος", region: "Νότιο Αιγαίο", areas: ["Χώρα Νάξου", "Αγία Άννα", "Πλάκα"] },
  { city: "Ζάκυνθος", region: "Ιόνια Νησιά", areas: ["Ζάκυνθος", "Αλυκές", "Λαγανάς"] },
  { city: "Κως", region: "Νότιο Αιγαίο", areas: ["Κως", "Τιγκάκι", "Καρδάμαινα"] },
  { city: "Σκιάθος", region: "Θεσσαλία", areas: ["Χώρα Σκιάθου", "Κουκουλιές"] },
  { city: "Κεφαλονιά", region: "Ιόνια Νησιά", areas: ["Αργοστόλι", "Λασσί", "Ληξούρι"] },
  { city: "Ρέθυμνο", region: "Κρήτη", areas: ["Κέντρο", "Περιβόλια", "Πλατανιάς Ρεθύμνου"] },
  { city: "Καλαμάτα", region: "Πελοπόννησος", areas: ["Κέντρο", "Μικρή Μαντίνεια", "Βελika"] },
  { city: "Ναύπλιο", region: "Πελοπόννησος", areas: ["Κέντρο", "Παλαμήδι", "Αρβανιτιά"] },
  { city: "Καβάλα", region: "Ανατολική Μακεδονία", areas: ["Κέντρο", "Φιλίππων", "Παναγία"] },
  { city: "Χίος", region: "Βόρειο Αιγαίο", areas: ["Χώρα Χίου", "Βροντάδος", "Καρδάμυλα"] },
  { city: "Λευκάδα", region: "Ιόνια Νησιά", areas: ["Λευκάδα", "Νυδρί", "Βασιλική"] },
  { city: "Καστοριά", region: "Δυτική Μακεδονία", areas: ["Κέντρο", "Μαντάρι"] },
  { city: "Αλεξανδρούπολη", region: "Ανατολική Μακεδονία", areas: ["Κέντρο", "Νέα Χώρα"] },
  { city: "Λαμία", region: "Στερεά Ελλάδα", areas: ["Κέντρο", "Άνω Λαμία"] },
  { city: "Κομοτηνή", region: "Ανατολική Μακεδονία", areas: ["Κέντρο", "Κομοτηνή"] },
];

/** Όλες οι γειτονιές καταλόγου */
export const GREEK_AREA_CATALOG: AreaCatalogEntry[] = [
  ...areasForCity("Αθήνα", ATHENS),
  ...areasForCity("Θεσσαλονίκη", THESSALONIKI),
  ...areasForCity("Πάτρα", PATRA),
  ...areasForCity("Ηράκλειο", HERAKLION),
  ...areasForCity("Λάρισα", LARISSA),
  ...areasForCity("Βόλος", VOLOS),
  ...areasForCity("Ιωάννινα", IOANNINA),
  ...areasForCity("Χανιά", CHANIA),
  ...areasForCity("Ρόδος", RHODES),
  ...areasForCity("Πτολεμαΐδα", [
    {
      district: "Πτολεμαΐδα - Κέντρο",
      region: "Δυτική Μακεδονία",
      areas: ["Κέντρο", "Ανθεμίων", "Σαρανταπόρος"],
    },
  ]),
  ...ISLANDS.flatMap(({ city, region, areas }) =>
    areas.map((area) => ({
      city,
      district: `${city} - Κέντρο`,
      region,
      area,
    }))
  ),
];

/** Δήμοι/περιφέρειες (χωρίς συγκεκριμένη γειτονιά) */
export function getDistrictEntries(): AreaCatalogEntry[] {
  const seen = new Set<string>();
  const out: AreaCatalogEntry[] = [];
  for (const e of GREEK_AREA_CATALOG) {
    const key = `${e.city}|${e.district}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      city: e.city,
      district: e.district,
      region: e.region,
      area: e.district,
    });
  }
  return out;
}

export function getAreasForDistrict(city: string, district: string): string[] {
  return GREEK_AREA_CATALOG.filter(
    (e) => e.city === city && e.district === district && e.area !== e.district
  ).map((e) => e.area);
}

export function findCatalogEntry(
  city: string,
  area: string
): AreaCatalogEntry | undefined {
  return GREEK_AREA_CATALOG.find(
    (e) => e.city === city && (e.area === area || e.district === area)
  );
}

/** Μεγάλες πόλεις με γειτονιές/προάστια — για προαιρετικό πεδίο περιοχής. */
export function cityHasSubAreas(city: string): boolean {
  if (!city.trim()) return false;
  const norm = normalizeLocationQuery(city);
  if ((GREEK_SETTLEMENTS_BY_CITY[norm]?.length ?? 0) > 0) return true;
  return GREEK_AREA_CATALOG.some(
    (e) => normalizeLocationQuery(e.city) === norm && e.area.trim() !== e.city.trim()
  );
}

/** Παραδείγματα περιοχών για placeholder — μόνο της επιλεγμένης πόλης. */
export function getCityAreaExamples(city: string, limit = 2): string[] {
  if (!city.trim()) return [];
  const norm = normalizeLocationQuery(city);
  const fromGenerated = GREEK_SETTLEMENTS_BY_CITY[norm];
  if (fromGenerated?.length) {
    return fromGenerated.slice(0, limit);
  }
  const areas: string[] = [];
  for (const entry of GREEK_AREA_CATALOG) {
    if (normalizeLocationQuery(entry.city) !== norm) continue;
    if (entry.area.trim() === entry.city.trim()) continue;
    if (areas.includes(entry.area)) continue;
    areas.push(entry.area);
    if (areas.length >= limit) break;
  }
  return areas;
}
