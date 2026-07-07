import type { Listing, ListingAvailabilityStatus } from "@/lib/types";

export type RentalType = "short_term" | "monthly" | "long_term";
export type PriceType = "per_night" | "per_month";
export type LegalRegistryType = "none" | "ama" | "esl" | "mag";
export type ApprovalStatus =
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "approved"
  | "rejected";
export type VerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "failed"
  | "needs_review"
  | "rejected";

export const RENTAL_TYPE_OPTIONS: { value: RentalType; label: string; description: string }[] = [
  {
    value: "short_term",
    label: "Βραχυχρόνια",
    description: "Για διαμονές μικρής διάρκειας. Απαιτείται ΑΜΑ/ΕΣΛ/ΜΑΓ όπου προβλέπεται.",
  },
  {
    value: "monthly",
    label: "Μηνιαία / μεσοπρόθεσμη",
    description: "Για επιπλωμένες διαμονές από 2 μήνες και πάνω.",
  },
  {
    value: "long_term",
    label: "Μακροχρόνια",
    description: "Για κλασικές μακροχρόνιες μισθώσεις κατοικίας.",
  },
];

/** Public MVP — short-term and monthly only */
export const MVP_PUBLIC_RENTAL_TYPES = ["short_term", "monthly"] as const satisfies readonly RentalType[];

export type MvpPublicRentalType = (typeof MVP_PUBLIC_RENTAL_TYPES)[number];

export const MVP_RENTAL_TYPE_OPTIONS = RENTAL_TYPE_OPTIONS.filter((o) =>
  MVP_PUBLIC_RENTAL_TYPES.includes(o.value as MvpPublicRentalType)
);

export const MVP_LISTING_TYPE_OPTIONS = [
  {
    value: "short_term" as const,
    label: "Βραχυχρόνια μίσθωση",
    description: "Για λίγες ημέρες ή σύντομη διαμονή.",
    helper:
      "Για σύντομες διαμονές έως 59 ημέρες, απαιτείται αριθμός καταχώρισης όπου προβλέπεται.",
  },
  {
    value: "monthly" as const,
    label: "Μηνιαία / μεσοπρόθεσμη διαμονή",
    description: "Για 2+ μήνες, εργασία, σπουδές ή προσωρινή μετακόμιση.",
    helper:
      "Για διαμονές 60+ ημερών δεν χρειάζεται ξεχωριστός αριθμός βραχυχρόνιας μίσθωσης.",
  },
] as const;

export const MVP_TAGLINE =
  "βραχυχρόνια και μηνιαία/μεσοπρόθεσμη";

export const MVP_TAGLINE_SENTENCE =
  "Αγγελίες για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη διαμονή, με καθαρές πληροφορίες και απευθείας επικοινωνία με τον αγγελιοδότη.";

export const SEARCH_RENTAL_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Όλοι οι τύποι" },
  { value: "short_term", label: "Βραχυχρόνια μίσθωση" },
  { value: "monthly", label: "Μηνιαία / μεσοπρόθεσμη" },
  { value: "long_term", label: "Μακροχρόνια" },
];

export const MVP_SEARCH_RENTAL_TYPE_OPTIONS = SEARCH_RENTAL_TYPE_OPTIONS.filter(
  (o) => o.value !== "long_term"
);

export const LEGAL_REGISTRY_OPTIONS: { value: LegalRegistryType; label: string }[] = [
  { value: "ama", label: "ΑΜΑ — Αριθμός Μητρώου Ακινήτου" },
  { value: "esl", label: "ΕΣΛ — Ειδικό Σήμα Λειτουργίας" },
  { value: "mag", label: "ΜΑΓ — Μοναδικός Αριθμός Γνωστοποίησης" },
  { value: "none", label: "—" },
];

export function rentalTypeBadgeLabel(type: RentalType | string | null | undefined): string {
  const t = type as RentalType;
  if (t === "short_term") return "Βραχυχρόνια";
  if (t === "long_term") return "Μακροχρόνια";
  return "Μηνιαία / μεσοπρόθεσμη";
}

export function listingRentalBadgeLabels(
  listing: Pick<Listing, "rental_type" | "price_monthly" | "price_per_night">
): { primary: string; secondary?: string } {
  const rt = listingRentalType(listing);
  if (rt === "short_term") return { primary: "Βραχυχρόνια" };
  return { primary: "Μηνιαία / μεσοπρόθεσμη" };
}

export function rentalTypeLabel(type: RentalType | string | null | undefined): string {
  const found = RENTAL_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? "Μηνιαία / μεσοπρόθεσμη";
}

export function parseRentalType(value: string | undefined): RentalType | undefined {
  if (value === "short_term" || value === "monthly" || value === "long_term") return value;
  return undefined;
}

export function parsePublicRentalType(value: string | undefined): MvpPublicRentalType | undefined {
  const parsed = parseRentalType(value);
  if (parsed === "short_term" || parsed === "monthly") return parsed;
  return undefined;
}

export function isPublicMvpListing(listing: Pick<Listing, "rental_type">): boolean {
  return listingRentalType(listing) !== "long_term";
}

export function listingSupportsShortTerm(
  listing: Pick<Listing, "rental_type" | "price_per_night">
): boolean {
  const rt = listingRentalType(listing);
  if (rt === "long_term") return false;
  if (rt === "short_term") return true;
  return false;
}

export function listingSupportsMonthly(
  listing: Pick<Listing, "rental_type" | "price_monthly" | "price_per_night">
): boolean {
  const rt = listingRentalType(listing);
  if (rt === "long_term") return false;
  if (rt === "monthly") return true;
  return false;
}

export function listingSupportsBothRentalTypes(
  listing: Pick<Listing, "rental_type" | "price_monthly" | "price_per_night">
): boolean {
  return false;
}

export function listingMatchesRentalTypeFilter(
  listing: Pick<Listing, "rental_type" | "price_monthly" | "price_per_night">,
  rentalType: MvpPublicRentalType
): boolean {
  if (rentalType === "short_term") return listingSupportsShortTerm(listing);
  return listingSupportsMonthly(listing);
}

export function listingRentalType(listing: Pick<Listing, "rental_type">): RentalType {
  return parseRentalType(listing.rental_type ?? undefined) ?? "monthly";
}

export function listingPriceType(listing: Pick<Listing, "rental_type" | "price_type">): PriceType {
  if (listing.price_type === "per_night" || listing.price_type === "per_month") {
    return listing.price_type;
  }
  return listingRentalType(listing) === "short_term" ? "per_night" : "per_month";
}

export function formatListingPrice(
  listing: Pick<Listing, "rental_type" | "price_type" | "price_monthly" | "price_per_night">
): { amount: number; unit: string; display: string } {
  const rentalType = listingRentalType(listing);
  const priceType = listingPriceType(listing);

  if (priceType === "per_night" || rentalType === "short_term") {
    const amount = listing.price_per_night ?? listing.price_monthly;
    return {
      amount,
      unit: "/ βράδυ",
      display: `€${amount.toLocaleString("el-GR")} / βράδυ`,
    };
  }

  const amount = listing.price_monthly;
  return {
    amount,
    unit: "/ μήνα",
    display: `€${amount.toLocaleString("el-GR")} / μήνα`,
  };
}

export function requiresAmaRegistry(
  rentalType: RentalType,
  acceptsUnder60Days?: boolean | null
): boolean {
  return rentalType === "short_term" || Boolean(acceptsUnder60Days);
}

export function generateMidoraVerificationCode(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `MIDORA-${n}`;
}

export const PORTAL_DISCLAIMER =
  "Το Midora παρέχει μόνο δυνατότητα επικοινωνίας. Η συμφωνία, η πληρωμή και οι φορολογικές/νομικές υποχρεώσεις γίνονται εκτός πλατφόρμας και αποτελούν ευθύνη των μερών.";

export const SHORT_TERM_MIN_STAY_OPTIONS = [
  "1 νύχτα",
  "3 νύχτες",
  "7 νύχτες",
  "Κατόπιν συνεννόησης",
] as const;

export const MONTHLY_MIN_STAY_OPTIONS = [
  "1+ μήνας",
  "2–3 μήνες",
  "4–6 μήνες",
  "6–12 μήνες",
  "12+ μήνες",
] as const;

export function formatMinStayLabel(
  listing: Pick<Listing, "rental_type" | "min_stay_label" | "min_months">
): string | null {
  if (listing.min_stay_label?.trim()) return listing.min_stay_label.trim();
  const rentalType = listingRentalType(listing);
  if (rentalType === "short_term") {
    if (listing.min_months && listing.min_months > 0) {
      const n = listing.min_months;
      return n === 1 ? "1 νύχτα" : `${n} νύχτες`;
    }
    return null;
  }
  if (rentalType === "long_term") {
    if (!listing.min_months) return "12+ μήνες";
    return listing.min_months >= 12 ? "12+ μήνες" : `${listing.min_months} μήνες`;
  }
  const months = listing.min_months;
  if (!months) return "2+ μήνες";
  if (months <= 1) return "2+ μήνες";
  return months === 1 ? "1 μήνας" : `${months} μήνες`;
}

/** Secondary lines for listing cards (min stay, guests, available from) */
export function listingCardDetailLines(
  listing: Pick<
    Listing,
    | "rental_type"
    | "min_stay_label"
    | "min_months"
    | "max_guests"
    | "available_from"
  >
): string[] {
  const lines: string[] = [];
  const rentalType = listingRentalType(listing);
  const minStay = formatMinStayLabel(listing);

  if (rentalType === "short_term") {
    if (minStay) lines.push(`Ελάχιστη διαμονή: ${minStay}`);
    if (listing.max_guests != null) lines.push(`Μέγ. άτομα: ${listing.max_guests}`);
  } else if (rentalType === "monthly") {
    lines.push(`Ελάχιστη διάρκεια: ${minStay ?? "2+ μήνες"}`);
    if (listing.max_guests != null) lines.push(`Μέγ. άτομα: ${listing.max_guests}`);
  }

  return lines;
}

export function formatAmaDisplay(
  listing: Pick<Listing, "ama_number" | "legal_registry_type">
): string | null {
  const num = listing.ama_number?.trim();
  if (!num) return null;
  const type = listing.legal_registry_type;
  if (type === "esl") return `ΕΣΛ: ${num}`;
  if (type === "mag") return `ΜΑΓ: ${num}`;
  return `ΑΜΑ: ${num}`;
}

export function needsPublicRegistryDisplay(
  listing: Pick<Listing, "rental_type" | "accepts_under_60_days">
): boolean {
  return requiresAmaRegistry(
    listingRentalType(listing),
    listing.accepts_under_60_days
  );
}

export function legalRegistryRegisteredBadge(
  listing: Pick<Listing, "legal_registry_type" | "ama_number">
): string | null {
  if (!listing.ama_number?.trim()) return null;
  const type = listing.legal_registry_type;
  if (type === "esl") return "Με καταχωρημένο ΕΣΛ";
  if (type === "mag") return "Με καταχωρημένο ΜΑΓ";
  return "Με καταχωρημένο ΑΜΑ";
}

/** Compact label for listing cards */
export function cardRegistryLabel(
  listing: Pick<
    Listing,
    "rental_type" | "accepts_under_60_days" | "ama_number" | "legal_registry_type"
  >
): string | null {
  if (!needsPublicRegistryDisplay(listing)) return null;
  const full = formatAmaDisplay(listing);
  if (full) return full.length > 22 ? (legalRegistryRegisteredBadge(listing) ?? full) : full;
  return null;
}

export function listingAmaApprovalError(
  listing: Pick<
    Listing,
    "rental_type" | "accepts_under_60_days" | "ama_number"
  >
): string | null {
  if (!requiresAmaRegistry(listingRentalType(listing), listing.accepts_under_60_days)) {
    return null;
  }
  if (!listing.ama_number?.trim()) {
    return "Δεν μπορεί να δημοσιευτεί βραχυχρόνια αγγελία χωρίς ΑΜΑ/ΕΣΛ/ΜΑΓ.";
  }
  return null;
}

export const AMA_DISCLAIMER =
  "Ο αριθμός μητρώου εμφανίζεται όπως δηλώθηκε από τον αγγελιοδότη.";

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  not_started: "Δεν ξεκίνησε",
  pending: "Σε αναμονή",
  verified: "Επαληθευμένο",
  failed: "Απέτυχε",
  needs_review: "Χρειάζεται έλεγχο",
  rejected: "Απορρίφθηκε",
};

export const PORTAL_LEGAL_BLOCKS = [
  "Το Midora είναι πλατφόρμα προβολής αγγελιών ακινήτων. Δεν αποτελεί μέρος οποιασδήποτε μίσθωσης, πληρωμής ή συμφωνίας μεταξύ των μερών.",
  "Ο αγγελιοδότης είναι αποκλειστικά υπεύθυνος για την ακρίβεια της αγγελίας, το δικαίωμα δημοσίευσης, την αναγραφή ΑΜΑ/ΕΣΛ/ΜΑΓ όπου απαιτείται και κάθε φορολογική, νομική ή διοικητική υποχρέωση.",
  "Η επικοινωνία μέσω Midora αποτελεί αρχική εκδήλωση ενδιαφέροντος. Η τελική συμφωνία και πληρωμή γίνονται εκτός πλατφόρμας.",
] as const;
