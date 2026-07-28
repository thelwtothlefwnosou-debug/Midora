/** @deprecated Use `Common.*` / next-intl messages — kept for POPULAR_AREAS place names only */
export const COPY = {
  utilitiesIncluded: "Λογαριασμοί περιλαμβάνονται",
  allIncluded: "Όλα περιλαμβάνονται",
  cleaningIncluded: "Η καθαριότητα περιλαμβάνεται",
  cleaningNotIncluded: "Η καθαριότητα δεν περιλαμβάνεται",
  utilitiesNotIncluded: "Οι λογαριασμοί δεν περιλαμβάνονται",
  expressInterest: "Στείλε ενδιαφέρον",
  sendMessage: "Στείλε μήνυμα",
  submitInterest: "Αποστολή ενδιαφέροντος",
  viewListing: "Δες αγγελία",
  contactAdvertiser: "Επικοινωνία με αγγελιοδότη",
  contactPhone: "Κινητό",
  showPhone: "Εμφάνιση κινητού",
  callNow: "Κάλεσε τώρα",
  sendEmail: "Στείλε email",
  viewAllPhotos: "Δες όλες τις φωτογραφίες",
  noPhoto: "Δεν υπάρχει φωτογραφία",
  whatsApp: "WhatsApp",
  contactHost: "Επικοινωνία με αγγελιοδότη",
  interestSuccessTitle: "Το μήνυμά σου στάλθηκε",
  interestSuccessText:
    "Το μήνυμά σου στάλθηκε στον ιδιοκτήτη. Θα επικοινωνήσει μαζί σου για διαθεσιμότητα και όρους.",
  reportSuccessText:
    "Η αναφορά σου καταχωρήθηκε. Η ομάδα του Midora θα την εξετάσει.",
  leadPrivacyNotice:
    "Με την αποστολή ενδιαφέροντος αποδέχεσαι τους Όρους χρήσης και την Πολιτική απορρήτου. Το Midora διαβιβάζει το μήνυμά σου στον αγγελιοδότη για σκοπούς αρχικής επικοινωνίας.",
} as const;

export type HomeFaqItem = { question: string; answer: string };

export const HOME_FAQ: HomeFaqItem[] = [
  {
    question: "Τι τύπους μίσθωσης υποστηρίζει το Midora;",
    answer:
      "Το Midora υποστηρίζει αγγελίες για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη διαμονή.",
  },
  {
    question: "Μπορώ να κάνω κράτηση μέσα από το Midora;",
    answer:
      "Όχι. Το Midora είναι πλατφόρμα προβολής αγγελιών και αρχικής επικοινωνίας. Δεν διαχειρίζεται κρατήσεις, πληρωμές ή συμφωνίες μεταξύ των μερών. Η τελική συνεννόηση γίνεται απευθείας μεταξύ των μερών, εκτός Midora.",
  },
  {
    question: "Πρέπει να στείλω προκαταβολή στον ιδιοκτήτη;",
    answer:
      "Το Midora δεν διαχειρίζεται πληρωμές, κρατήσεις ή προκαταβολές. Πριν στείλεις οποιοδήποτε ποσό, επιβεβαίωσε ταυτότητα, διαθεσιμότητα και στοιχεία ακινήτου. Για μηνιαία μίσθωση είναι ασφαλέστερο να δεις πρώτα το ακίνητο.",
  },
  {
    question: "Ποιος ευθύνεται αν προκληθεί ζημιά στο ακίνητο;",
    answer:
      "Ζημιές, φθορές ή οικονομικές διαφορές αποτελούν ζήτημα μεταξύ των μερών. Το Midora δεν παρέχει ασφάλιση, εγγύηση ζημιών, διαχείριση απαιτήσεων ή αποζημίωση.",
  },
  {
    question: "Χρειάζεται ΑΜΑ για βραχυχρόνια αγγελία;",
    answer:
      "Για βραχυχρόνια μίσθωση ή διαμονές κάτω από 60 ημερών, ο αγγελιοδότης δηλώνει ΑΜΑ, ΕΣΛ ή ΜΑΓ όπου απαιτείται.",
  },
  {
    question: "Πώς εμφανίζεται η διαθεσιμότητα;",
    answer:
      "Ο αγγελιοδότης μπορεί να δηλώνει μη διαθέσιμες περιόδους. Η διαθεσιμότητα εμφανίζεται ενημερωτικά και επιβεβαιώνεται απευθείας με τον αγγελιοδότη.",
  },
  {
    question: "Πώς επικοινωνώ με τον αγγελιοδότη;",
    answer:
      "Σε κάθε αγγελία μπορείς να επιλέξεις κινητό, email, μήνυμα μέσω Midora ή WhatsApp/Viber — ό,τι έχει ενεργοποιήσει ο αγγελιοδότης.",
  },
] as const satisfies HomeFaqItem[];

export const POPULAR_AREAS = [
  {
    city: "Αθήνα",
    labelKey: "cityAthens",
    blurbKey: "cityAthensBlurb",
    featured: true,
  },
  {
    city: "Θεσσαλονίκη",
    labelKey: "cityThessaloniki",
    blurbKey: "cityThessalonikiBlurb",
    featured: true,
  },
  {
    city: "Πάτρα",
    labelKey: "cityPatra",
    blurbKey: "cityPatraBlurb",
  },
  {
    city: "Ηράκλειο",
    labelKey: "cityHeraklion",
    blurbKey: "cityHeraklionBlurb",
  },
  {
    city: "Χανιά",
    labelKey: "cityChania",
    blurbKey: "cityChaniaBlurb",
  },
  {
    city: "Ιωάννινα",
    labelKey: "cityIoannina",
    blurbKey: "cityIoanninaBlurb",
  },
  {
    city: "Καλαμάτα",
    labelKey: "cityKalamata",
    blurbKey: "cityKalamataBlurb",
  },
  {
    city: "Βόλος",
    labelKey: "cityVolos",
    blurbKey: "cityVolosBlurb",
  },
  {
    city: "Καβάλα",
    labelKey: "cityKavala",
    blurbKey: "cityKavalaBlurb",
  },
  {
    city: "Κοζάνη",
    labelKey: "cityKozani",
    blurbKey: "cityKozaniBlurb",
  },
] as const;
