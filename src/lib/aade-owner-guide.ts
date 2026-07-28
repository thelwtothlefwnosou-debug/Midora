/**
 * Premium AADE owner guide — structural helpers, URLs, and Help Center content.
 * UI copy lives in next-intl (`Aade.guide`, `Aade.guide.helper`).
 * `buildAadeOwnerGuideHelpContent` still uses the Greek constants below for FAQ articles.
 */

import { AADE_GENERAL_DISCLAIMER } from "@/lib/midora-legal-copy";
import { AADE_SHORT_TERM_REGISTRY_URL } from "@/lib/registry-compliance";

export type AadeGuideTab = "short_term" | "monthly";

export type AadeHelperVariant =
  | "short_term"
  | "monthly"
  | "review"
  | "dashboard";

export const AADE_GUIDE_MODAL_TITLE = "Οδηγός ΑΑΔΕ για ιδιοκτήτες";

export const AADE_GUIDE_MODAL_SUBTITLE =
  "Γενική καθοδήγηση ανά τύπο μίσθωσης. Το Midora δεν υποβάλλει δηλώσεις για λογαριασμό σου.";

export const AADE_GUIDE_OFFICIAL_URL = AADE_SHORT_TERM_REGISTRY_URL;

export const AADE_HELPER_COPY: Record<
  AadeHelperVariant,
  {
    title: string;
    body: string;
    cta: string;
    note?: string;
  }
> = {
  short_term: {
    title: "Χρειάζεσαι αριθμό καταχώρισης;",
    body: "Για βραχυχρόνια διαμονή μπορεί να απαιτείται αριθμός όπως ΑΜΑ, ΕΣΛ ή ΜΑΓ. Συμπλήρωσε τον αριθμό που αντιστοιχεί στο ακίνητο, όπου απαιτείται.",
    cta: "Πού το βρίσκω στην ΑΑΔΕ;",
    note: "Το Midora δεν υποβάλλει δηλώσεις στην ΑΑΔΕ.",
  },
  monthly: {
    title: "Μηνιαία ή μακροχρόνια μίσθωση",
    body: "Για μηνιαία ή μακροχρόνια μίσθωση ενδέχεται να ισχύουν διαφορετικές δηλωτικές ή συμβατικές υποχρεώσεις. Το Midora δεν υποβάλλει μισθωτήρια στην ΑΑΔΕ.",
    cta: "Δες γενική καθοδήγηση",
  },
  review: {
    title: "Έλεγξε τις υποχρεώσεις σου",
    body: "Πριν υποβάλεις την αγγελία, βεβαιώσου ότι έχεις συμπληρώσει σωστά τον αριθμό καταχώρισης όπου απαιτείται και ότι γνωρίζεις τις σχετικές υποχρεώσεις σου.",
    cta: "Άνοιγμα οδηγού ΑΑΔΕ",
  },
  dashboard: {
    title: "Οδηγός ΑΑΔΕ",
    body: "Δες γενική καθοδήγηση για βραχυχρόνια και μηνιαία μίσθωση.",
    cta: "Άνοιγμα οδηγού",
  },
};

export const AADE_SHORT_TERM_TAB = {
  label: "Βραχυχρόνια",
  title: "Βραχυχρόνια διαμονή",
  intro:
    "Αν το ακίνητο διατίθεται για βραχυχρόνια διαμονή, ο ιδιοκτήτης ή διαχειριστής μπορεί να χρειάζεται να καταχωρήσει το ακίνητο στην ΑΑΔΕ και να χρησιμοποιεί αριθμό όπως ΑΜΑ, ΕΣΛ ή ΜΑΓ, όπου απαιτείται.",
  sections: [
    {
      id: "before_publish",
      title: "Πριν δημοσιεύσεις την αγγελία",
      steps: [
        "Συνδέσου στο myAADE.",
        "Άνοιξε την εφαρμογή Βραχυχρόνια Μίσθωση Ακινήτων.",
        "Καταχώρισε το ακίνητο στο Μητρώο Ακινήτων Βραχυχρόνιας Διαμονής, σύμφωνα με όσα ζητά η εφαρμογή.",
        "Κράτησε τον αριθμό καταχώρισης που αντιστοιχεί στο ακίνητο, όπως ΑΜΑ, ΕΣΛ ή ΜΑΓ, όπου απαιτείται.",
        "Συμπλήρωσε τον αριθμό αυτό στην αγγελία σου στο Midora.",
      ],
    },
    {
      id: "after_stay",
      title: "Μετά από πραγματική διαμονή",
      steps: [
        "Συνδέσου στο myAADE.",
        "Άνοιξε την εφαρμογή Βραχυχρόνια Μίσθωση Ακινήτων.",
        "Επίλεξε το ακίνητο / ΑΜΑ που αντιστοιχεί στη διαμονή.",
        "Συμπλήρωσε τα στοιχεία που ζητά η εφαρμογή, όπως ημερομηνίες, στοιχεία μισθωτή και συμφωνημένο ποσό.",
        "Αν ζητηθεί ηλεκτρονική πλατφόρμα και η συμφωνία προήλθε από το Midora, μπορεί να υπάρχει επιλογή όπως «Άλλες ψηφιακές πλατφόρμες», όπου μπορείς να αναφέρεις το Midora, σύμφωνα με όσα επιτρέπει η εφαρμογή.",
        "Υπόβαλε τη δήλωση και κράτησε το αποδεικτικό υποβολής.",
      ],
    },
  ],
  note: "Η πληρωμή απευθείας μεταξύ των μερών, ακόμη και με μετρητά, δεν σημαίνει ότι η μίσθωση δεν δηλώνεται.",
} as const;

export const AADE_MONTHLY_TAB = {
  label: "Μηνιαία / μακροχρόνια",
  title: "Μηνιαία / μακροχρόνια μίσθωση",
  intro:
    "Αν η συμφωνία αφορά μηνιαία ή μακροχρόνια μίσθωση, συνήθως δεν πρόκειται για Δήλωση Βραχυχρόνιας Διαμονής. Ο ιδιοκτήτης ακολουθεί τη διαδικασία ηλεκτρονικής υποβολής μισθωτηρίου στην ΑΑΔΕ, όπου απαιτείται.",
  steps: [
    "Συνδέσου στο myAADE.",
    "Άνοιξε την εφαρμογή Δηλώσεις Μίσθωσης Ακινήτων / Στοιχεία Μισθώσεων Ακίνητης Περιουσίας.",
    "Συμπλήρωσε στοιχεία εκμισθωτή και μισθωτή.",
    "Συμπλήρωσε στοιχεία ακινήτου, διάρκεια μίσθωσης και συμφωνημένο μίσθωμα, σύμφωνα με όσα ζητά η εφαρμογή.",
    "Υπόβαλε τη δήλωση και κράτησε το αποδεικτικό υποβολής.",
  ],
  note: "Για μηνιαίες ή μακροχρόνιες μισθώσεις, μην συμπληρώνεις ΑΜΑ στο Midora εκτός αν η συγκεκριμένη περίπτωση το απαιτεί.",
} as const;

export const AADE_PLATFORM_FAQ = {
  question: "Τι βάζω ως πλατφόρμα αν η συμφωνία ήρθε από το Midora;",
  answer:
    "Αν η εφαρμογή της ΑΑΔΕ ζητά ηλεκτρονική πλατφόρμα και η συμφωνία προήλθε από αγγελία στο Midora, μπορεί να υπάρχει διαθέσιμη επιλογή όπως «Άλλες ψηφιακές πλατφόρμες», όπου μπορείς να αναφέρεις το Midora, σύμφωνα με όσα επιτρέπει η εφαρμογή. Μην επιλέγεις Airbnb, Booking.com, Vrbo ή άλλη πλατφόρμα αν η συγκεκριμένη συμφωνία δεν προήλθε από εκεί.",
} as const;

export const AADE_GUIDE_DISCLAIMER = AADE_GENERAL_DISCLAIMER;

/** Full Help Center / FAQ article body. */
export function buildAadeOwnerGuideHelpContent(): string {
  const shortBefore = AADE_SHORT_TERM_TAB.sections[0];
  const shortAfter = AADE_SHORT_TERM_TAB.sections[1];

  return [
    AADE_GUIDE_MODAL_SUBTITLE,
    "",
    `## ${AADE_SHORT_TERM_TAB.title}`,
    AADE_SHORT_TERM_TAB.intro,
    "",
    `### ${shortBefore.title}`,
    ...shortBefore.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `### ${shortAfter.title}`,
    ...shortAfter.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    AADE_SHORT_TERM_TAB.note,
    "",
    `## ${AADE_MONTHLY_TAB.title}`,
    AADE_MONTHLY_TAB.intro,
    "",
    ...AADE_MONTHLY_TAB.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    AADE_MONTHLY_TAB.note,
    "",
    `## ${AADE_PLATFORM_FAQ.question}`,
    AADE_PLATFORM_FAQ.answer,
    "",
    "## Σημαντική σημείωση",
    AADE_GUIDE_DISCLAIMER,
  ].join("\n");
}

export function defaultTabForRentalMode(
  mode: AadeGuideTab | "unknown" | undefined
): AadeGuideTab {
  return mode === "monthly" ? "monthly" : "short_term";
}
