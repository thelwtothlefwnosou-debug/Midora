/**
 * Κύριες πόλεις & νησιά Ελλάδας για autocomplete (wizard + αναζήτηση).
 * Βάση: όλοι οι δήμοι ELSTAT (325) + χειροκίνητα aliases για δημοφιλείς πόλεις.
 */

import { GREEK_MUNICIPALITIES } from "@/lib/data/greek-municipalities.generated";
import { normalizeLocationQuery } from "@/lib/locations/normalize";

export type GreekCityEntry = {
  name: string;
  region: string;
  aliases?: string[];
  type?: "city" | "island";
};

/** Αναζήτηση περιφέρειας → πόλεις (π.χ. «Κρήτη» → Ηράκλειο, Χανιά…). */
export const GREEK_REGION_SEARCH: Array<{
  region: string;
  aliases: string[];
}> = [
  { region: "Κρήτη", aliases: ["κρητη", "κρητης", "crete", "kriti", "krit", "kriti"] },
  { region: "Αττική", aliases: ["αττικη", "αττικης", "attica", "attiki", "attiki"] },
  { region: "Ήπειρος", aliases: ["ηπειρος", "ηπειρου", "epirus", "epiro"] },
  { region: "Θεσσαλία", aliases: ["θεσσαλια", "thessaly", "thessalia"] },
  { region: "Πελοπόννησος", aliases: ["πελοποννησος", "peloponnese", "peloponnisos"] },
  { region: "Κεντρική Μακεδονία", aliases: ["κεντρικη μακεδονια", "central macedonia"] },
  {
    region: "Ανατολική Μακεδονία και Θράκη",
    aliases: ["ανατολικη μακεδονια", "θρακη", "thrace", "emt"],
  },
  { region: "Δυτική Μακεδονία", aliases: ["δυτικη μακεδονια", "western macedonia"] },
  { region: "Δυτική Ελλάδα", aliases: ["δυτικη ελλαδα", "western greece"] },
  { region: "Στερεά Ελλάδα", aliases: ["στερεα ελλαδα", "central greece"] },
  { region: "Ιόνια Νησιά", aliases: ["ιονια νησια", "ionian islands", "ionia"] },
  { region: "Νότιο Αιγαίο", aliases: ["νοτιο αιγαιο", "south aegean", "dodecanese", "cyclades"] },
  { region: "Βόρειο Αιγαίο", aliases: ["βορειο αιγαιο", "north aegean"] },
];

/** Χειροκίνητα aliases / διορθώσεις περιφέρειας για δημοφιλείς πόλεις. */
const CITY_ENRICHMENTS: GreekCityEntry[] = [
  { name: "Αθήνα", region: "Αττική", aliases: ["athens", "athina", "ath", "αθηνα"] },
  { name: "Θεσσαλονίκη", region: "Κεντρική Μακεδονία", aliases: ["thessaloniki", "salonica", "skg", "θεσσαλονικη"] },
  { name: "Πάτρα", region: "Δυτική Ελλάδα", aliases: ["patra", "patras", "πατρα"] },
  { name: "Ηράκλειο", region: "Κρήτη", aliases: ["heraklion", "iraklio", "irakleio", "ηρακλειο"] },
  { name: "Λάρισα", region: "Θεσσαλία", aliases: ["larisa", "larissa", "λαρισα"] },
  { name: "Βόλος", region: "Θεσσαλία", aliases: ["volos", "βολος"] },
  { name: "Ιωάννινα", region: "Ήπειρος", aliases: ["ioannina", "giannena", "ιωαννινα"] },
  { name: "Χανιά", region: "Κρήτη", aliases: ["chania", "xania", "χανια"] },
  { name: "Ρέθυμνο", region: "Κρήτη", aliases: ["rethymno", "rethymnon", "ρεθυμνο"] },
  { name: "Άγιος Νικόλαος", region: "Κρήτη", aliases: ["agios nikolaos", "ayios nikolaos", "αγιος νικολαος"] },
  { name: "Ιεράπετρα", region: "Κρήτη", aliases: ["ierapetra", "ιεραπετρα"] },
  { name: "Σητεία", region: "Κρήτη", aliases: ["sitia", "siteia", "σητεια"] },
  { name: "Πειραιάς", region: "Αττική", aliases: ["piraeus", "pireas", "peiraias", "πειραιας"] },
  { name: "Καβάλα", region: "Ανατολική Μακεδονία και Θράκη", aliases: ["kavala", "καβαλα"] },
  { name: "Αλεξανδρούπολη", region: "Ανατολική Μακεδονία και Θράκη", aliases: ["alexandroupoli", "alexandroupolis"] },
  { name: "Κομοτηνή", region: "Ανατολική Μακεδονία και Θράκη", aliases: ["komotini", "κομοτηνη"] },
  { name: "Ξάνθη", region: "Ανατολική Μακεδονία και Θράκη", aliases: ["xanthi", "ξανθη"] },
  { name: "Δράμα", region: "Ανατολική Μακεδονία και Θράκη", aliases: ["drama", "δραμα"] },
  { name: "Σέρρες", region: "Κεντρική Μακεδονία", aliases: ["serres", "σερρες"] },
  { name: "Κατερίνη", region: "Κεντρική Μακεδονία", aliases: ["katerini", "κατερινη"] },
  { name: "Βέροια", region: "Κεντρική Μακεδονία", aliases: ["veria", "voria", "βεροια"] },
  { name: "Κιλκίς", region: "Κεντρική Μακεδονία", aliases: ["kilkis", "κιλκις"] },
  { name: "Έδεσσα", region: "Κεντρική Μακεδονία", aliases: ["edessa", "εδεσσα"] },
  { name: "Πολύγυρος", region: "Κεντρική Μακεδονία", aliases: ["poligyros", "polygyros", "πολυγυρος"] },
  { name: "Ναούσα", region: "Κεντρική Μακεδονία", aliases: ["naousa", "naoussa", "ναουσα"] },
  { name: "Κοζάνη", region: "Δυτική Μακεδονία", aliases: ["kozani", "κοζανη"] },
  { name: "Πτολεμαΐδα", region: "Δυτική Μακεδονία", aliases: ["ptolemaida", "ptolemeida", "πτολεμαιδα"] },
  { name: "Φλώρινα", region: "Δυτική Μακεδονία", aliases: ["florina", "φλωρινα"] },
  { name: "Γρεβενά", region: "Δυτική Μακεδονία", aliases: ["grevena", "γρεβενα"] },
  { name: "Καστοριά", region: "Δυτική Μακεδονία", aliases: ["kastoria", "καστορια"] },
  { name: "Λαμία", region: "Στερεά Ελλάδα", aliases: ["lamia", "λαμια"] },
  { name: "Χαλκίδα", region: "Στερεά Ελλάδα", aliases: ["chalkida", "halkida", "χαλκιδα"] },
  { name: "Λιβαδειά", region: "Στερεά Ελλάδα", aliases: ["livadeia", "levadia", "λιβαδεια"] },
  { name: "Αμφισσα", region: "Στερεά Ελλάδα", aliases: ["amfissa", "αμφισσα"] },
  { name: "Τρίκαλα", region: "Θεσσαλία", aliases: ["trikala", "τρικαλα"] },
  { name: "Καρδίτσα", region: "Θεσσαλία", aliases: ["karditsa", "καρδιτσα"] },
  { name: "Μυτιλήνη", region: "Βόρειο Αιγαίο", aliases: ["mytilene", "mytilini", "μυτιληνη"] },
  { name: "Χίος", region: "Βόρειο Αιγαίο", aliases: ["chios", "χιος"], type: "island" },
  { name: "Σάμος", region: "Βόρειο Αιγαίο", aliases: ["samos", "σαμος"], type: "island" },
  { name: "Λήμνος", region: "Βόρειο Αιγαίο", aliases: ["limnos", "lemnos", "λημνος"], type: "island" },
  { name: "Κέρκυρα", region: "Ιόνια Νησιά", aliases: ["corfu", "kerkyra", "κερκυρα"], type: "island" },
  { name: "Ζάκυνθος", region: "Ιόνια Νησιά", aliases: ["zakynthos", "zante", "ζακυνθος"], type: "island" },
  { name: "Κεφαλονιά", region: "Ιόνια Νησιά", aliases: ["kefalonia", "cephalonia", "κεφαλονια"], type: "island" },
  { name: "Λευκάδα", region: "Ιόνια Νησιά", aliases: ["lefkada", "leucada", "λευκαδα"], type: "island" },
  { name: "Ρόδος", region: "Νότιο Αιγαίο", aliases: ["rhodes", "rodos", "ροδος"], type: "island" },
  { name: "Κως", region: "Νότιο Αιγαίο", aliases: ["kos", "κως"], type: "island" },
  { name: "Κάλυμνος", region: "Νότιο Αιγαίο", aliases: ["kalymnos", "καλυμνος"], type: "island" },
  { name: "Μύκονος", region: "Νότιο Αιγαίο", aliases: ["mykonos", "mikonos", "μυκονος"], type: "island" },
  { name: "Σαντορίνη", region: "Νότιο Αιγαίο", aliases: ["santorini", "thira", "σαντορινη"], type: "island" },
  { name: "Πάρος", region: "Νότιο Αιγαίο", aliases: ["paros", "παρος"], type: "island" },
  { name: "Νάξος", region: "Νότιο Αιγαίο", aliases: ["naxos", "ναξος"], type: "island" },
  { name: "Σύρος", region: "Νότιο Αιγαίο", aliases: ["syros", "siros", "συρος"], type: "island" },
  { name: "Τήνος", region: "Νότιο Αιγαίο", aliases: ["tinos", "τηνος"], type: "island" },
  { name: "Άνδρος", region: "Νότιο Αιγαίο", aliases: ["andros", "ανδρος"], type: "island" },
  { name: "Σκιάθος", region: "Θεσσαλία", aliases: ["skiathos", "σκιαθος"], type: "island" },
  { name: "Σκόπελος", region: "Θεσσαλία", aliases: ["skopelos", "σκοπελος"], type: "island" },
  { name: "Καλαμάτα", region: "Πελοπόννησος", aliases: ["kalamata", "καλαματα"] },
  { name: "Ναύπλιο", region: "Πελοπόννησος", aliases: ["nafplio", "nafplion", "ναυπλιο"] },
  { name: "Τρίπολη", region: "Πελοπόννησος", aliases: ["tripoli", "tripolis", "τριπολη"] },
  { name: "Σπάρτη", region: "Πελοπόννησος", aliases: ["sparta", "sparti", "σπαρτη"] },
  { name: "Κόρινθος", region: "Πελοπόννησος", aliases: ["corinth", "korinthos", "κορινθος"] },
  { name: "Άργος", region: "Πελοπόννησος", aliases: ["argos", "αργος"] },
  { name: "Πύργος", region: "Πελοπόννησος", aliases: ["pyrgos", "πυργος"] },
  { name: "Μεσολόγγι", region: "Δυτική Ελλάδα", aliases: ["messolonghi", "mesolongi", "μεσολογγι"] },
  { name: "Αγρίνιο", region: "Δυτική Ελλάδα", aliases: ["agrinio", "αγρινιο"] },
  { name: "Πρέβεζα", region: "Ήπειρος", aliases: ["preveza", "πρεβεζα"] },
  { name: "Άρτα", region: "Ήπειρος", aliases: ["arta", "αρτα"] },
  { name: "Θήβα", region: "Στερεά Ελλάδα", aliases: ["thebes", "thiva", "θηβα"] },
  { name: "Ορεστιάδα", region: "Ανατολική Μακεδονία και Θράκη", aliases: ["orestiada", "ορεστιαδα"] },
  { name: "Γιαννιτσά", region: "Κεντρική Μακεδονία", aliases: ["giannitsa", "γιαννιτσα"] },
  { name: "Κιάτο", region: "Πελοπόννησος", aliases: ["kiato", "κιατο"] },
];

function buildAllGreekCities(): GreekCityEntry[] {
  const byKey = new Map<string, GreekCityEntry>();

  for (const m of GREEK_MUNICIPALITIES) {
    byKey.set(normalizeLocationQuery(m.name), {
      name: m.name,
      region: m.region,
      type: m.type,
    });
  }

  for (const entry of CITY_ENRICHMENTS) {
    byKey.set(normalizeLocationQuery(entry.name), entry);
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, "el"));
}

/** Όλοι οι δήμοι + νησιά Ελλάδας (325+). */
export const GREEK_MAJOR_CITIES: GreekCityEntry[] = buildAllGreekCities();

const _seen = new Set<string>();
export const GREEK_MAJOR_CITIES_DEDUPED: GreekCityEntry[] = GREEK_MAJOR_CITIES.filter((c) => {
  const key = normalizeLocationQuery(c.name);
  if (_seen.has(key)) return false;
  _seen.add(key);
  return true;
});

export function resolveRegionFromQuery(query: string): string | null {
  const q = normalizeLocationQuery(query);
  if (!q || q.length < 3) return null;

  for (const entry of GREEK_REGION_SEARCH) {
    const regionNorm = normalizeLocationQuery(entry.region);

    if (regionNorm === q) return entry.region;
    if (entry.aliases.some((alias) => alias === q)) return entry.region;

    // Μερική αντιστοίχιση περιφέρειας — όχι για σύντομα prefix (π.χ. «θε» ≠ Θεσσαλία).
    if (q.length >= 5) {
      if (regionNorm.startsWith(q)) return entry.region;
      if (entry.aliases.some((alias) => alias.startsWith(q))) return entry.region;
    }
  }
  return null;
}

export function recordMatchesRegion(regionName: string | undefined, regionLabel: string): boolean {
  if (!regionName) return false;
  const a = normalizeLocationQuery(regionName);
  const b = normalizeLocationQuery(regionLabel);
  if (a.includes(b) || b.includes(a)) return true;
  if (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4)) return true;
  return false;
}
