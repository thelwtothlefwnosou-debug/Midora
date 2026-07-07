/**
 * Canonical Greek locations with greeklish / English / partial aliases.
 * Display is always Greek; search accepts any spelling.
 */

export type CanonicalLocation = {
  id: string;
  label: string;
  region: string;
  city: string;
  area?: string;
  district?: string;
  aliases: string[];
};

export const MIN_LOCATION_QUERY_LENGTH = 2;

export const POPULAR_LOCATION_IDS = [
  "athens",
  "athens_center",
  "thessaloniki",
  "glyfada",
  "kolonaki",
  "piraeus",
  "paros",
  "santorini",
  "mykonos",
  "chania",
];

function loc(
  id: string,
  label: string,
  region: string,
  city: string,
  aliases: string[],
  area?: string,
  district?: string
): CanonicalLocation {
  const base = [
    label,
    label.toLowerCase(),
    ...aliases,
    city,
    area,
    district,
  ].filter(Boolean) as string[];
  const normalizedAliases = new Set(
    base.map((a) => normalizeText(a)).filter((a) => a.length > 0)
  );
  return {
    id,
    label,
    region,
    city,
    area,
    district: district ?? area,
    aliases: [...normalizedAliases],
  };
}

export const CANONICAL_LOCATIONS: CanonicalLocation[] = [
  loc("athens", "Αθήνα", "Αττική", "Αθήνα", [
    "athens",
    "athina",
    "ath",
    "athin",
    "athina",
    "αθηνα",
    "αθήνα",
    "athhina",
  ]),
  loc(
    "athens_center",
    "Αθήνα Κέντρο",
    "Αττική",
    "Αθήνα",
    [
      "athens center",
      "athina kentro",
      "athina centro",
      "kentro",
      "αθηνα κεντρο",
      "αθήνα κέντρο",
      "κέντρο",
      "κεντρο",
    ],
    "Κέντρο",
    "Κέντρο"
  ),
  loc(
    "kolonaki",
    "Κολωνάκι",
    "Αθήνα",
    "Αθήνα",
    ["kolonaki", "kol", "kolona", "κολωνακι", "κολωνάκι"],
    "Κολωνάκι",
    "Κολωνάκι"
  ),
  loc(
    "pangrati",
    "Παγκράτι",
    "Αθήνα",
    "Αθήνα",
    ["pangrati", "pagkrati", "παγκρατι", "παγκράτι"],
    "Παγκράτι",
    "Παγκράτι"
  ),
  loc(
    "koukaki",
    "Κουκάκι",
    "Αθήνα",
    "Αθήνα",
    ["koukaki", "kouk", "κουκακι", "κουκάκι"],
    "Κουκάκι",
    "Κουκάκι"
  ),
  loc(
    "exarcheia",
    "Εξάρχεια",
    "Αθήνα",
    "Αθήνα",
    ["exarcheia", "exarhia", "εξαρχεια", "εξάρχεια"],
    "Εξάρχεια",
    "Εξάρχεια"
  ),
  loc(
    "glyfada",
    "Γλυφάδα",
    "Αττική",
    "Αθήνα",
    ["glyfada", "glifada", "gly", "γλυφαδα", "γλυφάδα"],
    "Γλυφάδα",
    "Γλυφάδα"
  ),
  loc(
    "voula",
    "Βούλα",
    "Αττική",
    "Αθήνα",
    ["voula", "vou", "βουλα", "βούλα"],
    "Βούλα",
    "Βούλα"
  ),
  loc(
    "vouliagmeni",
    "Βουλιαγμένη",
    "Αττική",
    "Αθήνα",
    ["vouliagmeni", "voulia", "βουλιαγμενη", "βουλιαγμένη"],
    "Βουλιαγμένη",
    "Βουλιαγμένη"
  ),
  loc("piraeus", "Πειραιάς", "Αττική", "Πειραιάς", [
    "piraeus",
    "pireas",
    "pir",
    "peiraias",
    "πειραιας",
    "πειραιάς",
  ]),
  loc(
    "marousi",
    "Μαρούσι",
    "Αττική",
    "Αθήνα",
    ["marousi", "maroussi", "μαρουσι", "μαρούσι"],
    "Μαρούσι",
    "Μαρούσι"
  ),
  loc(
    "chalandri",
    "Χαλάνδρι",
    "Αττική",
    "Αθήνα",
    ["chalandri", "xalandri", "χαλανδρι", "χαλάνδρι"],
    "Χαλάνδρι",
    "Χαλάνδρι"
  ),
  loc(
    "kifisia",
    "Κηφισιά",
    "Αττική",
    "Αθήνα",
    ["kifisia", "kifissia", "κηφισια", "κηφισιά"],
    "Κηφισιά",
    "Κηφισιά"
  ),
  loc("thessaloniki", "Θεσσαλονίκη", "Κεντρική Μακεδονία", "Θεσσαλονίκη", [
    "thessaloniki",
    "thessalon",
    "thessalonik",
    "thess",
    "thes",
    "the",
    "salonika",
    "salonica",
    "sal",
    "θεσσαλονικη",
    "θεσσαλονίκη",
    "θεσσα",
    "θεσσαλ",
    "θεσσ",
  ]),
  loc(
    "kalamaria",
    "Καλαμαριά",
    "Θεσσαλονίκη",
    "Θεσσαλονίκη",
    ["kalamaria", "καλαμαρια", "καλαμαριά"],
    "Καλαμαριά",
    "Καλαμαριά"
  ),
  loc("patra", "Πάτρα", "Δυτική Ελλάδα", "Πάτρα", [
    "patra",
    "patras",
    "πατρα",
    "πάτρα",
  ]),
  loc("heraklion", "Ηράκλειο", "Κρήτη", "Ηράκλειο", [
    "heraklion",
    "herakleio",
    "iraklio",
    "irakleio",
    "irak",
    "hera",
    "ηρακλειο",
    "ηράκλειο",
  ]),
  loc("chania", "Χανιά", "Κρήτη", "Χανιά", [
    "chania",
    "xania",
    "chan",
    "xan",
    "χανια",
    "χανιά",
  ]),
  loc("rethymno", "Ρέθυμνο", "Κρήτη", "Ρέθυμνο", [
    "rethymno",
    "rethimno",
    "ρεθυμνο",
    "ρέθυμνο",
  ]),
  loc("paros", "Πάρος", "Νότιο Αιγαίο", "Πάρος", [
    "paros",
    "par",
    "παρος",
    "πάρος",
  ]),
  loc("naxos", "Νάξος", "Νότιο Αιγαίο", "Νάξος", [
    "naxos",
    "nax",
    "ναξος",
    "νάξος",
  ]),
  loc("santorini", "Σαντορίνη", "Νότιο Αιγαίο", "Σαντορίνη", [
    "santorini",
    "sant",
    "thira",
    "thira",
    "σαντορινη",
    "σαντορίνη",
    "θηρα",
    "θήρα",
  ]),
  loc("mykonos", "Μύκονος", "Νότιο Αιγαίο", "Μύκονος", [
    "mykonos",
    "myk",
    "mikonos",
    "μυκονος",
    "μύκονος",
  ]),
  loc("rhodes", "Ρόδος", "Νότιο Αιγαίο", "Ρόδος", [
    "rhodes",
    "rodos",
    "rhod",
    "rodi",
    "ροδος",
    "ρόδος",
  ]),
  loc("corfu", "Κέρκυρα", "Ιόνια Νησιά", "Κέρκυρα", [
    "corfu",
    "kerkyra",
    "κερκυρα",
    "κέρκυρα",
  ]),
  loc("kalamata", "Καλαμάτα", "Πελοπόννησος", "Καλαμάτα", [
    "kalamata",
    "καλαματα",
    "καλαμάτα",
  ]),
  loc("nafplio", "Ναύπλιο", "Πελοπόννησος", "Ναύπλιο", [
    "nafplio",
    "nafplion",
    "ναυπλιο",
    "ναύπλιο",
  ]),
  loc("volos", "Βόλος", "Θεσσαλία", "Βόλος", ["volos", "βολος", "βόλος"]),
  loc("larisa", "Λάρισα", "Θεσσαλία", "Λάρισα", [
    "larisa",
    "larissa",
    "λαρισα",
    "λάρισα",
  ]),
  loc("ioannina", "Ιωάννινα", "Ήπειρος", "Ιωάννινα", [
    "ioannina",
    "giannena",
    "ιωαννινα",
    "ιωάννινα",
  ]),
  loc("ptolemaida", "Πτολεμαΐδα", "Δυτική Μακεδονία", "Πτολεμαΐδα", [
    "ptolemaida",
    "ptolemeida",
    "ptolema",
    "pto",
    "πτολεμαιδα",
    "πτολεμαΐδα",
  ]),
];

const LOCATION_BY_ID = new Map(CANONICAL_LOCATIONS.map((l) => [l.id, l]));

export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

type ScoredLocation = { loc: CanonicalLocation; score: number };

function scoreAlias(query: string, alias: string): number {
  if (!alias || !query) return 0;
  if (alias === query) return 100;
  if (alias.startsWith(query)) return 85 - Math.min(20, alias.length - query.length);
  if (query.startsWith(alias) && alias.length >= 3) return 70;
  // Avoid short queries matching inside longer aliases (e.g. "the" inside "athina")
  if (query.length >= 4 && alias.includes(query)) {
    return 45 - Math.min(15, alias.length - query.length);
  }
  return 0;
}

function scoreLocation(query: string, loc: CanonicalLocation): number {
  let best = scoreAlias(query, normalizeText(loc.label));
  for (const alias of loc.aliases) {
    best = Math.max(best, scoreAlias(query, alias));
  }
  if (loc.id === "thessaloniki" && (query === "sal" || query.startsWith("sal"))) {
    best = Math.max(best, 82);
  }
  return best;
}

export function searchLocations(query: string, limit = 12): CanonicalLocation[] {
  const q = normalizeText(query);

  if (!q) {
    return POPULAR_LOCATION_IDS.map((id) => LOCATION_BY_ID.get(id)!).filter(Boolean);
  }

  if (q.length < MIN_LOCATION_QUERY_LENGTH) {
    return POPULAR_LOCATION_IDS.map((id) => LOCATION_BY_ID.get(id)!).filter(Boolean).slice(
      0,
      limit
    );
  }

  const scored: ScoredLocation[] = [];
  for (const loc of CANONICAL_LOCATIONS) {
    const score = scoreLocation(q, loc);
    if (score > 0) scored.push({ loc, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.loc.label.localeCompare(b.loc.label, "el");
  });

  const seen = new Set<string>();
  const results: CanonicalLocation[] = [];
  for (const { loc } of scored) {
    if (seen.has(loc.id)) continue;
    seen.add(loc.id);
    results.push(loc);
    if (results.length >= limit) break;
  }

  return results;
}

/** Best canonical match for search filtering (strong match only) */
export function resolveCanonicalLocation(query: string): CanonicalLocation | null {
  const q = normalizeText(query);
  if (!q) return null;

  const results = searchLocations(query, 5);
  if (results.length === 0) return null;

  const top = results[0];
  const topScore = scoreLocation(q, top);
  if (topScore >= 70) return top;

  if (q.length >= 3 && topScore >= 45) return top;

  return null;
}

/** Resolve raw input to canonical Greek label when possible */
export function resolveLocation(query: string): {
  label: string;
  canonical: CanonicalLocation | null;
} {
  const canonical = resolveCanonicalLocation(query);
  const trimmed = query.trim();
  return {
    label: canonical?.label ?? trimmed,
    canonical,
  };
}

export function canonicalDisplayLabel(query: string): string {
  return resolveCanonicalLocation(query)?.label ?? query.trim();
}
