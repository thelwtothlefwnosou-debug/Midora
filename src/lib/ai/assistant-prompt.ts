import type { MatchPrefs } from "@/lib/ai/listing-context";
import type { ListingWithImages } from "@/lib/types";

const CITY_ALIASES: Record<string, string> = {
  θεσσαλονικη: "Θεσσαλονίκη",
  αθηνα: "Αθήνα",
  πατρα: "Πάτρα",
  ηρακλειο: "Ηράκλειο",
};

function normalizeGreek(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseSearchIntent(message: string): MatchPrefs {
  const text = normalizeGreek(message);
  const prefs: MatchPrefs = {};

  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (text.includes(alias) || text.includes(normalizeGreek(city))) {
      prefs.city = city;
      break;
    }
  }

  const priceMatch =
    text.match(/(?:μεχρι|εως|max|budget)\s*€?\s*(\d{2,5})/i) ??
    text.match(/(\d{2,5})\s*(?:€|ευρω|eur)/i) ??
    text.match(/€\s*(\d{2,5})/);
  if (priceMatch) prefs.maxPrice = parseInt(priceMatch[1], 10);

  const bedroomMatch = text.match(/(\d+)\s*(?:υ\/δ|υπνοδωμάτ|bedroom)/i);
  if (bedroomMatch) prefs.minBedrooms = parseInt(bedroomMatch[1], 10);

  const monthMatch = text.match(/(\d+)\s*(?:μήν|μην)/i);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    prefs.durationMonths = months;
    prefs.maxMinMonths = months;
  }

  if (text.includes("πάρκιν") || text.includes("parking")) prefs.needsParking = true;
  if (text.includes("κατοικίδ") || text.includes("pet")) prefs.needsPets = true;
  if (text.includes("καθαρι") || text.includes("cleaning")) prefs.needsCleaning = true;
  if (text.includes("remote") || text.includes("εργασ") || text.includes("work")) {
    prefs.furnished = true;
    prefs.utilitiesIncluded = true;
  }
  if (text.includes("κέντρ") || text.includes("κεντρο")) prefs.area = "κέντρο";

  return prefs;
}

export type QueryIntent = {
  prefs: MatchPrefs;
  sortBy?: "price_asc" | "price_desc" | "newest";
  pickOne?: boolean;
  offTopic?: boolean;
  compareCheapest?: boolean;
  wantsListingCount?: boolean;
};

export function mergePrefsFromHistory(
  current: MatchPrefs,
  history: { role: string; content: string }[]
): MatchPrefs {
  const merged = { ...current };
  for (const msg of history) {
    if (msg.role !== "user") continue;
    const prev = parseSearchIntent(msg.content);
    if (!merged.city && prev.city) merged.city = prev.city;
    if (!merged.area && prev.area) merged.area = prev.area;
    if (!merged.maxPrice && prev.maxPrice) merged.maxPrice = prev.maxPrice;
    if (!merged.minBedrooms && prev.minBedrooms) merged.minBedrooms = prev.minBedrooms;
    if (!merged.needsParking && prev.needsParking) merged.needsParking = prev.needsParking;
    if (!merged.needsPets && prev.needsPets) merged.needsPets = prev.needsPets;
    if (!merged.furnished && prev.furnished) merged.furnished = prev.furnished;
    if (!merged.durationMonths && prev.durationMonths) {
      merged.durationMonths = prev.durationMonths;
      merged.maxMinMonths = prev.maxMinMonths;
    }
  }
  return merged;
}

export function parseQueryIntent(
  message: string,
  history: { role: string; content: string }[] = []
): QueryIntent {
  const text = normalizeGreek(message);
  const prefs = mergePrefsFromHistory(parseSearchIntent(message), history);

  const offTopic =
    /καιρ|weather|προγνωσ|βροχ|ηλιο|θερμοκρασ|ποδοσφαι|πολιτικ|εκλογ|μουσικ|ταινι|συνταγ|χρηματιστηρ|bitcoin|ποδηλατ/.test(
      text
    ) && !/εργασ|remote|διαμον|ενοικ|σπιτι|ακινητ|midora|τιμ/.test(text);

  const compareCheapest =
    /φθην|cheapest|πιο φθην|ελαχιστ|lowest|λιγοτερ|φτην/.test(text) ||
    (/στείλ|στειλ|δειξ|δειξε|πες μου|ποιο|πια|send|show/.test(text) &&
      /φθην|cheapest|ελαχιστ|φτην/.test(text)) ||
    (/^(το|μονο|μόνο)\s/.test(text.trim()) && /φθην|φτην|ελαχιστ/.test(text));

  const compareExpensive = /ακριβ|expensive|πιο ακριβ/.test(text);

  const pickOne =
    compareCheapest ||
    compareExpensive ||
    /^(ποιο|ποια|ποιος)\b/.test(text.trim()) ||
    /μονο ενα|μόνο ένα|το καλυτερο|το καλύτερο/.test(text);

  let sortBy: QueryIntent["sortBy"];
  if (compareCheapest) sortBy = "price_asc";
  else if (compareExpensive) sortBy = "price_desc";
  else if (/νεοτερ|recent|τελευται|προσφατ/.test(text)) sortBy = "newest";

  const wantsListingCount = /ποσα|πόσα|count|αριθμ/.test(text);

  return {
    prefs,
    sortBy,
    pickOne,
    offTopic,
    compareCheapest,
    wantsListingCount,
  };
}

export function filterListingsByPrefs(
  listings: ListingWithImages[],
  prefs: MatchPrefs
): ListingWithImages[] {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return listings.filter((listing) => {
    if (prefs.city && !norm(listing.city).includes(norm(prefs.city))) return false;
    if (prefs.area && !norm(listing.area).includes(norm(prefs.area))) return false;
    if (prefs.maxPrice && listing.price_monthly > prefs.maxPrice * 1.05) return false;
    if (prefs.minBedrooms && listing.bedrooms < prefs.minBedrooms) return false;
    if (prefs.needsParking && !listing.has_parking) return false;
    if (prefs.needsPets && !listing.pets_allowed) return false;
    if (prefs.furnished && !listing.furnished) return false;
    if (prefs.utilitiesIncluded && !listing.utilities_included) return false;
    if (prefs.maxMinMonths && listing.min_months > prefs.maxMinMonths) return false;
    return true;
  });
}

export function sortListingsForIntent(
  listings: ListingWithImages[],
  sortBy?: QueryIntent["sortBy"]
): ListingWithImages[] {
  const copy = [...listings];
  if (sortBy === "price_asc") {
    return copy.sort((a, b) => a.price_monthly - b.price_monthly);
  }
  if (sortBy === "price_desc") {
    return copy.sort((a, b) => b.price_monthly - a.price_monthly);
  }
  if (sortBy === "newest") {
    return copy.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  return copy;
}

export const ASSISTANT_SYSTEM_RULES = `Είσαι ο AI Rental Assistant της Midora (portal αγγελιών για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη διαμονή στην Ελλάδα).

ΚΑΝΟΝΕΣ (υποχρεωτικοί):
- ΠΟΤΕ μην εφευρίσκεις πληροφορίες.
- Μίλα ΜΟΝΟ με βάση τα δεδομένα που σου δίνονται και το ιστορικό συνομιλίας.
- Απάντα ΠΡΩΤΑ στην ΤΕΛΕΥΤΑΙΑ ερώτηση του χρήστη — όχι ξανά την ίδια λίστα αν ζήτησε κάτι διαφορετικό (π.χ. «το πιο φθηνό» μετά από λίστα).
- Αν η ερώτηση είναι εκτός Midora (καιρός, πολιτική, γενικές γνώσεις), πες ευγενικά ότι βοηθάς μόνο με ακίνητα Midora.
- Αν δεν υπάρχουν δεδομένα, πες: "Δεν υπάρχουν διαθέσιμες πληροφορίες."
- Μην κάνεις υποθέσεις για internet, θόρυβο, ασφάλεια, μεταφορικά κ.λπ. αν δεν υπάρχουν στη βάση.
- Σύντομες, πρακτικές απαντήσεις στα Ελληνικά (εκτός αν ο χρήστης γράφει Αγγλικά).
- Σε σελίδα λεπτομέρειας ακινήτου, απάντα για ΑΥΤΟ το ακίνητο εκτός αν ζητήσει σύγκριση/αναζήτηση.
- Για εγγύηση/check-in/check-out: χρησιμοποίησε μόνο min_months, utilities_included, pets_allowed, cleaning_included — όχι φανταστικούς όρους. Μην αναφέρεις κράτηση, checkout ή πληρωμή μέσω Midora.
- Το Midora δεν υποβάλλει δηλώσεις ΑΑΔΕ, δεν δίνει φορολογική/νομική συμβουλή, δεν καλύπτει ζημιές και δεν μεσολαβεί για αποζημίωση.
- Όταν προτείνεις listings, αναφέρε τίτλο + περιοχή + τιμή — όχι copy-paste της ίδιας απάντησης.`;

export function buildContextualFallbackReply(
  message: string,
  intent: QueryIntent,
  listings: ListingWithImages[],
  options?: {
    focusListing?: ListingWithImages | null;
    page?: string;
  }
): string {
  if (intent.offTopic) {
    return "Βοηθάω μόνο με αναζήτηση και πληροφορίες ακινήτων στο Midora — τιμές, διαθεσιμότητα, περιοχές και λεπτομέρειες αγγελιών. Δεν μπορώ να απαντήσω σε ερωτήσεις εκτός πλατφόρμας (π.χ. καιρός, ειδήσεις).";
  }

  const focus = options?.focusListing;
  const onListingPage = Boolean(focus && options?.page?.includes("/listings/"));

  if (onListingPage && focus && !intent.compareCheapest && !intent.prefs.city) {
    const text = normalizeGreek(message);
    if (
      /τιμ|price|ακριβ|φθην|καλ|worth|αξιζ/.test(text) ||
      /παρκ|pet|κατοικ|υπνοδ|bedroom|μην|month|διαμον/.test(text)
    ) {
      return `Για το «${focus.title}» (${focus.area}, ${focus.city}): €${focus.price_monthly}/μήνα, ${focus.bedrooms} υ/δ, ελάχιστη διαμονή ${focus.min_months} μήνας${focus.utilities_included ? ", λογαριασμοί περιλαμβάνονται" : ""}${focus.has_parking ? ", πάρκινγκ" : ""}${focus.pets_allowed ? ", κατοικίδια επιτρέπονται" : ""}. Για επικοινωνία, πάτησε «Ενδιαφέρομαι» ή χρησιμοποίησε WhatsApp.`;
    }
  }

  let pool = filterListingsByPrefs(listings, intent.prefs);
  if (pool.length === 0) pool = [...listings];
  pool = sortListingsForIntent(pool, intent.sortBy);

  if (pool.length === 0) {
    if (intent.prefs.city) {
      return `Δεν βρήκα ενεργές αγγελίες στη ${intent.prefs.city}${intent.prefs.maxPrice ? ` μέχρι €${intent.prefs.maxPrice}` : ""} αυτή τη στιγμή. Δοκίμασε άλλη περιοχή ή φίλτρα στην αναζήτηση.`;
    }
    return "Δεν βρήκα ενεργές αγγελίες αυτή τη στιγμή. Δοκίμασε άλλη πόλη ή φίλτρα στην αναζήτηση.";
  }

  if (intent.wantsListingCount && intent.prefs.city) {
    return `Υπάρχουν ${pool.length} διαθέσιμ${pool.length === 1 ? "ο" : "α"} ακίνητ${pool.length === 1 ? "ο" : "α"} στη ${intent.prefs.city} στο Midora αυτή τη στιγμή.`;
  }

  if (intent.compareCheapest || (intent.pickOne && intent.sortBy === "price_asc")) {
    const cheapest = pool[0];
    const scope = intent.prefs.city ? ` στη ${intent.prefs.city}` : "";
    return `Το πιο οικονομικό${scope} που βρήκα είναι «${cheapest.title}» (${cheapest.area}, ${cheapest.city}) — €${cheapest.price_monthly}/μήνα, ${cheapest.bedrooms} υ/δ. Δες λεπτομέρειες από το link παρακάτω.`;
  }

  if (intent.pickOne && intent.sortBy === "price_desc") {
    const top = pool[0];
    return `Το πιο ακριβό${intent.prefs.city ? ` στη ${intent.prefs.city}` : ""} είναι «${top.title}» — €${top.price_monthly}/μήνα (${top.area}).`;
  }

  const top = pool.slice(0, intent.pickOne ? 1 : 3);
  const lines = top.map(
    (l) => `• ${l.title} (${l.area}, ${l.city}) — €${l.price_monthly}/μήνα`
  );

  const intro = intent.prefs.city
    ? `Για ${intent.prefs.city}${intent.prefs.maxPrice ? ` μέχρι €${intent.prefs.maxPrice}` : ""}, `
    : "";

  return `${intro}βρήκα ${pool.length} σχετικ${pool.length === 1 ? "ή" : "ές"} επιλογ${pool.length === 1 ? "ή" : "ές"}${intent.pickOne ? "" : ` (δείχνω ${top.length})`}:\n\n${lines.join("\n")}\n\nΆνοιξε τις αγγελίες από τα links παρακάτω.`;
}
