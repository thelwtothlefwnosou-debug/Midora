/**
 * Extract FAQ Q&A from assistant faq-*.ts into a clean JSON dump,
 * then merge Faq / Help / Contact / Legal.listingRules (+ Listings leftovers)
 * into messages/el.json and messages/en.json.
 *
 * Greek FAQ bodies come from source. English FAQ bodies come from
 * scripts/faq-en-overrides.json when present; otherwise a stub is filled
 * by scripts/faq-en-built.json (generated alongside).
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function parseTsString(src, startIdx) {
  const quote = src[startIdx];
  if (quote !== '"' && quote !== "'" && quote !== "`") return null;
  let i = startIdx + 1;
  let out = "";
  if (quote === "`") {
    while (i < src.length) {
      if (src[i] === "\\") {
        out += src[i + 1];
        i += 2;
        continue;
      }
      if (src[i] === "`") return { value: out, end: i + 1 };
      out += src[i++];
    }
    return null;
  }
  while (i < src.length) {
    if (src[i] === "\\") {
      out += src[i + 1];
      i += 2;
      continue;
    }
    if (src[i] === quote) return { value: out, end: i + 1 };
    out += src[i++];
  }
  return null;
}

function skipWs(src, i) {
  while (i < src.length && /\s/.test(src[i])) i++;
  return i;
}

/** Parse string or string[] .join("\\n") expression starting at idx. */
function parseAnswerExpr(src, startIdx) {
  let i = skipWs(src, startIdx);
  if (src[i] === '"' || src[i] === "'" || src[i] === "`") {
    const s = parseTsString(src, i);
    return s;
  }
  if (src[i] === "[") {
    // array of strings / identifiers joined
    const parts = [];
    i++;
    while (i < src.length) {
      i = skipWs(src, i);
      if (src[i] === "]") {
        i++;
        break;
      }
      if (src[i] === "," || src[i] === "\n") {
        i++;
        continue;
      }
      if (src[i] === '"' || src[i] === "'" || src[i] === "`") {
        const s = parseTsString(src, i);
        if (!s) break;
        parts.push(s.value);
        i = s.end;
        continue;
      }
      // identifier
      let id = "";
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) id += src[i++];
      if (id) parts.push(`__ID__${id}`);
      else break;
    }
    i = skipWs(src, i);
    // optional .join("\n")
    if (src.slice(i, i + 5) === ".join") {
      i = src.indexOf(")", i) + 1;
    }
    return { value: parts.join("\n"), end: i, parts };
  }
  // bare identifier
  let id = "";
  while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) id += src[i++];
  if (id) return { value: `__ID__${id}`, end: i };
  return null;
}

function extractFromFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const items = [];
  const idRe = /\bid:\s*/g;
  let m;
  while ((m = idRe.exec(src))) {
    let i = skipWs(src, m.index + m[0].length);
    const idStr = parseTsString(src, i);
    if (!idStr) continue;
    const id = idStr.value;

    // find question after this id within ~800 chars
    const slice = src.slice(idStr.end, idStr.end + 2500);
    const qMatch = /question:\s*/.exec(slice);
    if (!qMatch) continue;
    const qExpr = parseAnswerExpr(slice, qMatch.index + qMatch[0].length);
    if (!qExpr) continue;

    const afterQ = slice.slice(qExpr.end);
    const aMatch = /answer:\s*/.exec(afterQ);
    if (!aMatch) continue;
    const aExpr = parseAnswerExpr(afterQ, aMatch.index + aMatch[0].length);
    if (!aExpr) continue;

    const afterA = afterQ.slice(aExpr.end);
    const cMatch = /category:\s*"([^"]+)"/.exec(afterA.slice(0, 400));
    if (!cMatch) continue;

    items.push({
      id,
      question: qExpr.value,
      answer: aExpr.value,
      category: cMatch[1],
    });
  }
  return items;
}

// Legal constant resolutions (Greek)
const LEGAL = {
  MIDORA_ROLE_FULL:
    "Το Midora λειτουργεί ως πλατφόρμα προβολής αγγελιών και αρχικής επικοινωνίας. Δεν αποτελεί μέρος οποιασδήποτε μίσθωσης, πληρωμής ή συμφωνίας μεταξύ ιδιοκτήτη και ενδιαφερόμενου. Η τελική διαθεσιμότητα, η συμφωνία, η πληρωμή και οι σχετικές φορολογικές ή νομικές υποχρεώσεις πραγματοποιούνται απευθείας μεταξύ των μερών, εκτός Midora.",
  DAMAGE_FAQ_QUESTION: "Ποιος ευθύνεται αν προκληθεί ζημιά στο ακίνητο;",
  DAMAGE_FAQ_ANSWER:
    "Το Midora λειτουργεί ως πλατφόρμα προβολής αγγελιών και αρχικής επικοινωνίας. Δεν αποτελεί μέρος της μίσθωσης ή της συμφωνίας μεταξύ ιδιοκτήτη και επισκέπτη/μισθωτή. Ζημιές, φθορές, απώλειες ή οικονομικές διαφορές που προκύπτουν από τη χρήση του ακινήτου αποτελούν ζήτημα μεταξύ των μερών, σύμφωνα με τη μεταξύ τους συμφωνία και την ισχύουσα νομοθεσία.\n\nΤο Midora δεν παρέχει ασφάλιση, εγγύηση ζημιών, διαχείριση απαιτήσεων ή αποζημίωση για φθορές στο ακίνητο.",
  ASSISTANT_AADE_SAFE_REPLY:
    "Το Midora δεν υποβάλλει δηλώσεις στην ΑΑΔΕ για λογαριασμό ιδιοκτητών. Αν η συμφωνία προήλθε από αγγελία στο Midora και αφορά βραχυχρόνια διαμονή, ο ιδιοκτήτης/διαχειριστής είναι υπεύθυνος για τη Δήλωση Βραχυχρόνιας Διαμονής. Αν η εφαρμογή ζητά πλατφόρμα, μπορεί να υπάρχει επιλογή όπως «Άλλες ψηφιακές πλατφόρμες», όπου ο ιδιοκτήτης μπορεί να αναφέρει το Midora σύμφωνα με όσα επιτρέπει η εφαρμογή. Για τη σωστή συμπλήρωση, συμβουλεύσου λογιστή ή την ΑΑΔΕ.",
  AADE_GENERAL_DISCLAIMER:
    "Οι πληροφορίες παρέχονται ως γενική ενημέρωση για τη χρήση της πλατφόρμας και δεν αποτελούν φορολογική, λογιστική ή νομική συμβουλή. Το Midora δεν υποβάλλει δηλώσεις στην ΑΑΔΕ και δεν αναλαμβάνει φορολογικές ή νομικές υποχρεώσεις για λογαριασμό ιδιοκτητών ή επισκεπτών. Για τη σωστή συμπλήρωση και για την περίπτωσή σου, συμβουλεύσου λογιστή, νομικό ή την ΑΑΔΕ.",
  AADE_SHORT_DISCLAIMER:
    "Οι πληροφορίες είναι γενική ενημέρωση και δεν αποτελούν φορολογική ή νομική συμβουλή. Για τη σωστή συμπλήρωση, συμβουλεύσου λογιστή ή την ΑΑΔΕ.",
};

function resolveIds(text) {
  return text.replace(/__ID__([A-Za-z0-9_]+)/g, (_, id) => {
    if (LEGAL[id]) return LEGAL[id];
    if (id === "buildAadeOwnerGuideHelpContent") {
      return AADE_GUIDE_EL;
    }
    return `[MISSING:${id}]`;
  });
}

const AADE_GUIDE_EL = [
  "Γενική καθοδήγηση ανά τύπο μίσθωσης. Το Midora δεν υποβάλλει δηλώσεις για λογαριασμό σου.",
  "",
  "## Βραχυχρόνια διαμονή",
  "Αν το ακίνητο διατίθεται για βραχυχρόνια διαμονή, ο ιδιοκτήτης ή διαχειριστής μπορεί να χρειάζεται να καταχωρήσει το ακίνητο στην ΑΑΔΕ και να χρησιμοποιεί αριθμό όπως ΑΜΑ, ΕΣΛ ή ΜΑΓ, όπου απαιτείται.",
  "",
  "### Πριν δημοσιεύσεις την αγγελία",
  "1. Συνδέσου στο myAADE.",
  "2. Άνοιξε την εφαρμογή Βραχυχρόνια Μίσθωση Ακινήτων.",
  "3. Καταχώρισε το ακίνητο στο Μητρώο Ακινήτων Βραχυχρόνιας Διαμονής, σύμφωνα με όσα ζητά η εφαρμογή.",
  "4. Κράτησε τον αριθμό καταχώρισης που αντιστοιχεί στο ακίνητο, όπως ΑΜΑ, ΕΣΛ ή ΜΑΓ, όπου απαιτείται.",
  "5. Συμπλήρωσε τον αριθμό αυτό στην αγγελία σου στο Midora.",
  "",
  "### Μετά από πραγματική διαμονή",
  "1. Συνδέσου στο myAADE.",
  "2. Άνοιξε την εφαρμογή Βραχυχρόνια Μίσθωση Ακινήτων.",
  "3. Επίλεξε το ακίνητο / ΑΜΑ που αντιστοιχεί στη διαμονή.",
  "4. Συμπλήρωσε τα στοιχεία που ζητά η εφαρμογή, όπως ημερομηνίες, στοιχεία μισθωτή και συμφωνημένο ποσό.",
  "5. Αν ζητηθεί ηλεκτρονική πλατφόρμα και η συμφωνία προήλθε από το Midora, μπορεί να υπάρχει επιλογή όπως «Άλλες ψηφιακές πλατφόρμες», όπου μπορείς να αναφέρεις το Midora, σύμφωνα με όσα επιτρέπει η εφαρμογή.",
  "6. Υπόβαλε τη δήλωση και κράτησε το αποδεικτικό υποβολής.",
  "",
  "Η πληρωμή απευθείας μεταξύ των μερών, ακόμη και με μετρητά, δεν σημαίνει ότι η μίσθωση δεν δηλώνεται.",
  "",
  "## Μηνιαία / μακροχρόνια μίσθωση",
  "Αν η συμφωνία αφορά μηνιαία ή μακροχρόνια μίσθωση, συνήθως δεν πρόκειται για Δήλωση Βραχυχρόνιας Διαμονής. Ο ιδιοκτήτης ακολουθεί τη διαδικασία ηλεκτρονικής υποβολής μισθωτηρίου στην ΑΑΔΕ, όπου απαιτείται.",
  "",
  "1. Συνδέσου στο myAADE.",
  "2. Άνοιξε την εφαρμογή Δηλώσεις Μίσθωσης Ακινήτων / Στοιχεία Μισθώσεων Ακίνητης Περιουσίας.",
  "3. Συμπλήρωσε στοιχεία εκμισθωτή και μισθωτή.",
  "4. Συμπλήρωσε στοιχεία ακινήτου, διάρκεια μίσθωσης και συμφωνημένο μίσθωμα, σύμφωνα με όσα ζητά η εφαρμογή.",
  "5. Υπόβαλε τη δήλωση και κράτησε το αποδεικτικό υποβολής.",
  "",
  "Για μηνιαίες ή μακροχρόνιες μισθώσεις, μην συμπληρώνεις ΑΜΑ στο Midora εκτός αν η συγκεκριμένη περίπτωση το απαιτεί.",
  "",
  "## Τι βάζω ως πλατφόρμα αν η συμφωνία ήρθε από το Midora;",
  "Αν η εφαρμογή της ΑΑΔΕ ζητά ηλεκτρονική πλατφόρμα και η συμφωνία προήλθε από αγγελία στο Midora, μπορεί να υπάρχει διαθέσιμη επιλογή όπως «Άλλες ψηφιακές πλατφόρμες», όπου μπορείς να αναφέρεις το Midora, σύμφωνα με όσα επιτρέπει η εφαρμογή. Μην επιλέγεις Airbnb, Booking.com, Vrbo ή άλλη πλατφόρμα αν η συγκεκριμένη συμφωνία δεν προήλθε από εκεί.",
  "",
  "## Σημαντική σημείωση",
  LEGAL.AADE_GENERAL_DISCLAIMER,
].join("\n");

const ORDER = [
  "search",
  "public_listing",
  "inquiries",
  "pricing_availability",
  "photos_amenities",
  "owner_listing",
  "owner_dashboard",
  "cohosts",
  "external_links",
  "profile",
  "safety",
  "troubleshooting",
];

const LABELS_EL = {
  search: "Αναζήτηση ακινήτου",
  public_listing: "Δημόσια αγγελία",
  inquiries: "Αιτήματα και επικοινωνία",
  pricing_availability: "Τιμές και διαθεσιμότητα",
  photos_amenities: "Φωτογραφίες και παροχές",
  owner_listing: "Ιδιοκτήτες / ανέβασμα αγγελίας",
  owner_dashboard: "Dashboard ιδιοκτήτη",
  cohosts: "Συνοικοδεσπότες",
  external_links: "Σύνδεσμοι αξιοπιστίας",
  profile: "Προφίλ και λογαριασμός",
  safety: "Ασφάλεια και εμπιστοσύνη",
  troubleshooting: "Τεχνικά προβλήματα",
};

const LABELS_EN = {
  search: "Property search",
  public_listing: "Public listing",
  inquiries: "Inquiries and contact",
  pricing_availability: "Prices and availability",
  photos_amenities: "Photos and amenities",
  owner_listing: "Owners / publishing a listing",
  owner_dashboard: "Owner dashboard",
  cohosts: "Co-hosts",
  external_links: "Trust links",
  profile: "Profile and account",
  safety: "Safety and trust",
  troubleshooting: "Technical issues",
};

const dir = path.join(ROOT, "src/lib/assistant");
const files = fs
  .readdirSync(dir)
  .filter(
    (f) =>
      f.startsWith("faq-") &&
      f.endsWith(".ts") &&
      !f.includes("types") &&
      !f.includes("index")
  );

let all = [];
for (const f of files) {
  const items = extractFromFile(path.join(dir, f));
  console.log(f, items.length);
  all = all.concat(items);
}

all = all.map((item) => ({
  ...item,
  question: resolveIds(item.question),
  answer: resolveIds(item.answer),
}));

const missing = all.filter(
  (i) => i.question.includes("[MISSING") || i.answer.includes("[MISSING")
);
if (missing.length) {
  console.error(
    "Unresolved:",
    missing.map((m) => m.id)
  );
  process.exit(1);
}

console.log("TOTAL", all.length);

// Load EN overrides if present
const enPath = path.join(ROOT, "scripts/faq-en-translations.json");
const enMap = fs.existsSync(enPath)
  ? JSON.parse(fs.readFileSync(enPath, "utf8"))
  : {};

function buildFaqNamespace(locale) {
  const labels = locale === "el" ? LABELS_EL : LABELS_EN;
  const groups = {};
  for (const cat of ORDER) {
    const items = all.filter((i) => i.category === cat);
    const itemObj = {};
    for (const it of items) {
      if (locale === "el") {
        itemObj[it.id] = { q: it.question, a: it.answer };
      } else {
        const tr = enMap[it.id];
        itemObj[it.id] = {
          q: tr?.q ?? `[EN] ${it.question}`,
          a: tr?.a ?? `[EN] ${it.answer}`,
        };
      }
    }
    groups[cat] = { title: labels[cat], items: itemObj };
  }

  if (locale === "el") {
    return {
      metaTitle: "Συχνές ερωτήσεις",
      metaDescription:
        "Συχνές ερωτήσεις για αναζήτηση, αγγελίες, ιδιοκτήτες και χρήση του Midora.",
      title: "Συχνές ερωτήσεις",
      subtitle:
        "Απαντήσεις αποκλειστικά για το Midora — αναζήτηση, αγγελίες, αιτήματα, ιδιοκτήτες και ασφάλεια.",
      noAnswer: "Δεν βρήκες απάντηση;",
      contactLink: "Επικοινώνησε μαζί μας",
      helpLink: "Κέντρο βοήθειας",
      groupOrder: ORDER,
      groups,
    };
  }
  return {
    metaTitle: "Frequently asked questions",
    metaDescription:
      "Frequently asked questions about search, listings, owners, and using Midora.",
    title: "Frequently asked questions",
    subtitle:
      "Answers specifically about Midora — search, listings, inquiries, owners, and safety.",
    noAnswer: "Didn't find an answer?",
    contactLink: "Contact us",
    helpLink: "Help center",
    groupOrder: ORDER,
    groups,
  };
}

// Help: chrome + top FAQs (subset of visitor-facing)
const HELP_TOP_IDS = [
  "home-what-is-midora",
  "search-how",
  "search-dates-required",
  "inquiries-send-generic",
  "safety-send-deposit",
  "safety-midora-payments",
  "legal-midora-role",
  "owner-listing-create",
  "owner-listing-publish",
  "public-listing-no-exact-address",
];

function buildHelp(locale) {
  const faq = buildFaqNamespace(locale);
  const topItems = {};
  for (const id of HELP_TOP_IDS) {
    // find in groups
    for (const cat of ORDER) {
      if (faq.groups[cat].items[id]) {
        topItems[id] = faq.groups[cat].items[id];
        break;
      }
    }
  }
  if (locale === "el") {
    return {
      metaTitle: "Βοήθεια",
      metaDescription:
        "Βοήθεια για αναζήτηση, αγγελίες, αιτήματα, ιδιοκτήτες, φωτογραφίες, διαθεσιμότητα και λογαριασμό στο Midora.",
      eyebrow: "Βοήθεια",
      title: "Πώς μπορούμε να σε βοηθήσουμε;",
      subtitle:
        "Σύντομες απαντήσεις για αναζήτηση, αγγελίες, αιτήματα, ιδιοκτήτες, ασφάλεια και τεχνικά θέματα στο Midora.",
      topTitle: "Συχνές ερωτήσεις",
      categoriesTitle: "Όλες οι κατηγορίες",
      noAnswer: "Δεν βρήκες απάντηση;",
      contactLink: "Επικοινώνησε μαζί μας",
      faqLink: "Συχνές ερωτήσεις",
      topIds: HELP_TOP_IDS,
      topItems,
    };
  }
  return {
    metaTitle: "Help",
    metaDescription:
      "Help with search, listings, inquiries, owners, photos, availability, and your Midora account.",
    eyebrow: "Help",
    title: "How can we help you?",
    subtitle:
      "Short answers about search, listings, inquiries, owners, safety, and technical topics on Midora.",
    topTitle: "Top questions",
    categoriesTitle: "All categories",
    noAnswer: "Didn't find an answer?",
    contactLink: "Contact us",
    faqLink: "Frequently asked questions",
    topIds: HELP_TOP_IDS,
    topItems,
  };
}

function buildContact(locale) {
  if (locale === "el") {
    return {
      metaTitle: "Επικοινωνία",
      metaDescription:
        "Επικοινώνησε με το Midora για ιδιοκτήτες, ενοικιαστές και γενικές ερωτήσεις.",
      title: "Επικοινωνία",
      subtitle: "Είμαστε εδώ για ιδιοκτήτες, ενοικιαστές και γενικές ερωτήσεις",
      emailLabel: "Email",
      listingsTitle: "Για αγγελίες",
      listingsText:
        "Κάλεσε απευθείας τον ιδιοκτήτη από τη σελίδα του ακινήτου",
      seeFaqPrefix: "Δες και τις",
      faqLink: "Συχνές ερωτήσεις",
    };
  }
  return {
    metaTitle: "Contact",
    metaDescription:
      "Contact Midora for owners, renters, and general questions.",
    title: "Contact",
    subtitle: "We're here for owners, renters, and general questions",
    emailLabel: "Email",
    listingsTitle: "About listings",
    listingsText: "Call the owner directly from the property page",
    seeFaqPrefix: "Also see the",
    faqLink: "Frequently asked questions",
  };
}

function buildListingRules(locale) {
  if (locale === "el") {
    return {
      metaTitle: "Κανόνες δημοσίευσης αγγελιών",
      metaDescription: "Κανόνες για ακριβείς και ασφαλείς αγγελίες στο Midora.",
      eyebrow: "Για αγγελιοδότες",
      title: "Κανόνες δημοσίευσης αγγελιών",
      subtitle:
        "Οι κανόνες αυτοί ισχύουν για κάθε αγγελία που υποβάλλεται στο Midora. Σκοπός τους είναι ακριβείς πληροφορίες, ασφάλεια χρηστών και δίκαιη προβολή.",
      accuracyTitle: "Ακρίβεια και περιεχόμενο",
      accuracy1:
        "Η αγγελία πρέπει να αφορά πραγματικό ακίνητο που μπορείς να διαθέσεις.",
      accuracy2:
        "Οι φωτογραφίες πρέπει να αντιστοιχούν στο ακίνητο — όχι ψεύτικες ή άσχετες εικόνες.",
      accuracy3:
        "Η τιμή, η διαθεσιμότητα και οι όροι διαμονής πρέπει να είναι ξεκάθαροι και μη παραπλανητικοί.",
      accuracy4:
        "Δεν επιτρέπονται εξωτερικοί σύνδεσμοι προς αμφίβολες ή εξαπατητικές σελίδες.",
      accuracy5:
        "Μην δημοσιεύεις προσωπικά στοιχεία επικοινωνίας στον τίτλο ή την περιγραφή.",
      registryTitle: "Βραχυχρόνια μίσθωση και αριθμός καταχώρισης",
      registryP1:
        "Όπου απαιτείται από τη νομοθεσία, πρέπει να δηλώνεται έγκυρος αριθμός καταχώρισης (ΑΜΑ, ΕΣΛ ή ΜΑΓ) που αντιστοιχεί στο ακίνητο. Το Midora μπορεί να ζητήσει διευκρινίσεις ή διορθώσεις πριν από τη δημοσίευση.",
      registryP2:
        "Το Midora δεν επαληθεύει αυτόματα στοιχεία με την ΑΑΔΕ και δεν αποτελεί μέρος φορολογικών ή διοικητικών διαδικασιών.",
      registryP3Prefix: "Δες επίσης τον",
      registryGuideLink: "οδηγό βραχυχρόνιας μίσθωσης",
      reviewTitle: "Έλεγχος και αλλαγές από το Midora",
      reviewP1:
        "Το Midora μπορεί να ελέγξει αγγελίες, να ζητήσει αλλαγές, να τις κρύψει ή να τις αφαιρέσει αν δεν πληρούν τους κανόνες ή αν υπάρχουν έγκυρες αναφορές.",
      reviewP2:
        "Μπορεί να ζητηθούν πρόσθετα στοιχεία ή αποδεικτικά για την ορθότητα της αγγελίας.",
      relatedTitle: "Σχετικά έγγραφα",
      termsLink: "Όροι χρήσης",
      privacyLink: "Πολιτική απορρήτου",
    };
  }
  return {
    metaTitle: "Listing publication rules",
    metaDescription: "Rules for accurate and safe listings on Midora.",
    eyebrow: "For advertisers",
    title: "Listing publication rules",
    subtitle:
      "These rules apply to every listing submitted on Midora. Their purpose is accurate information, user safety, and fair presentation.",
    accuracyTitle: "Accuracy and content",
    accuracy1:
      "The listing must concern a real property that you can offer.",
    accuracy2:
      "Photos must match the property — not fake or unrelated images.",
    accuracy3:
      "Price, availability, and stay terms must be clear and not misleading.",
    accuracy4:
      "External links to dubious or deceptive pages are not allowed.",
    accuracy5:
      "Do not publish personal contact details in the title or description.",
    registryTitle: "Short-term rental and registry number",
    registryP1:
      "Where required by law, a valid registry number (AMA, ESL, or MAG) that matches the property must be declared. Midora may request clarifications or corrections before publication.",
    registryP2:
      "Midora does not automatically verify details with AADE and is not part of tax or administrative procedures.",
    registryP3Prefix: "See also the",
    registryGuideLink: "short-term rental guide",
    reviewTitle: "Review and changes by Midora",
    reviewP1:
      "Midora may review listings, request changes, hide them, or remove them if they do not meet the rules or if there are valid reports.",
    reviewP2:
      "Additional details or proof of the listing's accuracy may be requested.",
    relatedTitle: "Related documents",
    termsLink: "Terms of use",
    privacyLink: "Privacy policy",
  };
}

const listingsExtrasEl = {
  sort: {
    label: "Ταξινόμηση",
    ariaLabel: "Ταξινόμηση αποτελεσμάτων",
    recommended: "Προτεινόμενα",
    newest: "Νεότερες αγγελίες",
    priceAsc: "Τιμή: χαμηλότερη πρώτα",
    priceDesc: "Τιμή: υψηλότερη πρώτα",
    amenitiesDesc: "Περισσότερες παροχές",
    bedroomsDesc: "Περισσότερα υπνοδωμάτια",
  },
  filter: {
    recommended: "Προτεινόμενα",
    roomsBeds: "Χώροι και κρεβάτια",
    bedrooms: "Υπνοδωμάτια",
    bathrooms: "Μπάνια",
    propertyType: "Τύπος ακινήτου",
    popularAmenities: "Δημοφιλείς παροχές",
    monthlyTerms: "Όροι μηνιαίας μίσθωσης",
    minStayMonths: "Ελάχιστη διάρκεια μίσθωσης (μήνες)",
    minSqm: "Ελάχιστα τ.μ.",
    placeholderMonths: "π.χ. 3",
    placeholderSqm: "π.χ. 45",
    pricePerNight: "Τιμή ανά βράδυ",
    pricePerMonth: "Τιμή ανά μήνα",
    perMonthSuffix: "/ μήνα",
    minPrice: "Ελάχιστη τιμή",
    maxPrice: "Μέγιστη τιμή",
    presetTo50: "Έως €50",
    preset50_100: "€50–€100",
    preset100_150: "€100–€150",
    preset150Plus: "€150+",
    presetTo800: "Έως €800",
    preset800_1200: "€800–€1.200",
    preset1200_1600: "€1.200–€1.600",
    preset1600Plus: "€1.600+",
    chipFrom: "από {value} {unit}",
    chipTo: "έως {value} {unit}",
    chipRange: "{min}–{max} {unit}",
    unitNight: "€/βράδυ",
    unitMonth: "€/μήνα",
    chipBedrooms: "{count}+ υπνοδωμάτια",
    chipBathrooms: "{count}+ μπάνια",
    chipMinMonths: "Ελάχ. {count} μήνες",
    chipMinSqm: "από {value} τ.μ.",
    typeApartment: "Διαμέρισμα",
    typeHouse: "Σπίτι / Μονοκατοικία",
    typeStudio: "Studio",
    typeVilla: "Βίλα",
    typeRoom: "Δωμάτιο",
    typeOther: "Άλλο",
    furnished: "Επιπλωμένο",
    billsInPrice: "Λογαριασμοί μέσα στην τιμή",
    petsAllowed: "Επιτρέπονται κατοικίδια",
    freeParking: "Δωρεάν στάθμευση",
    heatingClimate: "Θέρμανση / κλιματισμός",
    billsIncluded: "Λογαριασμοί περιλαμβάνονται",
  },
};

const listingsExtrasEn = {
  sort: {
    label: "Sort",
    ariaLabel: "Sort results",
    recommended: "Recommended",
    newest: "Newest listings",
    priceAsc: "Price: lowest first",
    priceDesc: "Price: highest first",
    amenitiesDesc: "Most amenities",
    bedroomsDesc: "Most bedrooms",
  },
  filter: {
    recommended: "Recommended",
    roomsBeds: "Rooms and beds",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    propertyType: "Property type",
    popularAmenities: "Popular amenities",
    monthlyTerms: "Monthly rental terms",
    minStayMonths: "Minimum rental duration (months)",
    minSqm: "Minimum sqm",
    placeholderMonths: "e.g. 3",
    placeholderSqm: "e.g. 45",
    pricePerNight: "Price per night",
    pricePerMonth: "Price per month",
    perMonthSuffix: "/ month",
    minPrice: "Minimum price",
    maxPrice: "Maximum price",
    presetTo50: "Up to €50",
    preset50_100: "€50–€100",
    preset100_150: "€100–€150",
    preset150Plus: "€150+",
    presetTo800: "Up to €800",
    preset800_1200: "€800–€1,200",
    preset1200_1600: "€1,200–€1,600",
    preset1600Plus: "€1,600+",
    chipFrom: "from {value} {unit}",
    chipTo: "up to {value} {unit}",
    chipRange: "{min}–{max} {unit}",
    unitNight: "€/night",
    unitMonth: "€/month",
    chipBedrooms: "{count}+ bedrooms",
    chipBathrooms: "{count}+ bathrooms",
    chipMinMonths: "Min. {count} months",
    chipMinSqm: "from {value} sqm",
    typeApartment: "Apartment",
    typeHouse: "House",
    typeStudio: "Studio",
    typeVilla: "Villa",
    typeRoom: "Room",
    typeOther: "Other",
    furnished: "Furnished",
    billsInPrice: "Utilities included in price",
    petsAllowed: "Pets allowed",
    freeParking: "Free parking",
    heatingClimate: "Heating / air conditioning",
    billsIncluded: "Utilities included",
  },
};

function mergeMessages(locale) {
  const file = path.join(ROOT, `messages/${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(file, "utf8"));

  messages.Faq = buildFaqNamespace(locale);
  messages.Help = buildHelp(locale);
  messages.Contact = buildContact(locale);
  messages.Legal = messages.Legal || {};
  messages.Legal.listingRules = buildListingRules(locale);

  const extras = locale === "el" ? listingsExtrasEl : listingsExtrasEn;
  messages.Listings = {
    ...messages.Listings,
    ...extras,
  };

  messages.Feedback = messages.Feedback || {};
  messages.Feedback.reportIssue =
    locale === "el" ? "Αναφορά προβλήματος" : "Report an issue";

  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + "\n", "utf8");
  console.log("merged", file);
}

// Dump Greek for EN translation authoring
const dump = {};
for (const it of all) {
  dump[it.id] = { q: it.question, a: it.answer, category: it.category };
}
fs.writeFileSync(
  path.join(ROOT, "scripts/faq-el-source.json"),
  JSON.stringify(dump, null, 2),
  "utf8"
);

const enCoverage = Object.keys(enMap).length;
console.log("EN translations present:", enCoverage, "/", all.length);

mergeMessages("el");
mergeMessages("en");

if (enCoverage < all.length) {
  const missingIds = all.map((i) => i.id).filter((id) => !enMap[id]);
  fs.writeFileSync(
    path.join(ROOT, "scripts/faq-en-missing-ids.json"),
    JSON.stringify(missingIds, null, 2),
    "utf8"
  );
  console.warn(
    "WARNING: EN FAQ missing",
    missingIds.length,
    "ids — see scripts/faq-en-missing-ids.json"
  );
}
