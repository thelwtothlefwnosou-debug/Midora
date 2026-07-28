import type { LegalRegistryType } from "@/lib/types";
import { isValidRegistryNumber } from "@/lib/listing-wizard-validation";
import { pickLocale } from "@/lib/locale-fallbacks";

/** Official AADE informational page — opens in new tab only. */
export const AADE_SHORT_TERM_REGISTRY_URL =
  "https://www.aade.gr/brahyhronia-misthosi-akiniton";

export type RegistryOwnerStatus =
  | "empty"
  | "filled"
  | "needs_review"
  | "reviewed_by_midora"
  | "needs_changes";

const REGISTRY_OWNER_STATUS_LABELS_EL: Record<RegistryOwnerStatus, string> = {
  empty: "Δεν έχει συμπληρωθεί",
  filled: "Συμπληρώθηκε",
  needs_review: "Χρειάζεται έλεγχο",
  reviewed_by_midora: "Ελέγχθηκε από Midora",
  needs_changes: "Χρειάζονται αλλαγές",
};

const REGISTRY_OWNER_STATUS_LABELS_EN: Record<RegistryOwnerStatus, string> = {
  empty: "Not completed",
  filled: "Completed",
  needs_review: "Needs review",
  reviewed_by_midora: "Reviewed by Midora",
  needs_changes: "Changes required",
};

/** @deprecated Use `getRegistryOwnerStatusLabel(status, locale)` */
export const REGISTRY_OWNER_STATUS_LABELS = REGISTRY_OWNER_STATUS_LABELS_EL;

export function getRegistryOwnerStatusLabel(
  status: RegistryOwnerStatus,
  locale?: string
): string {
  return pickLocale(
    locale,
    REGISTRY_OWNER_STATUS_LABELS_EL[status],
    REGISTRY_OWNER_STATUS_LABELS_EN[status]
  );
}

export function getRegistryHelperText(type: LegalRegistryType, locale?: string): string {
  switch (type) {
    case "ama":
      return pickLocale(
        locale,
        "Συμπλήρωσε τον 11ψήφιο ΑΜΑ χωρίς κενά.",
        "Enter the 11-digit AMA number with no spaces."
      );
    case "esl":
      return pickLocale(
        locale,
        "Συμπλήρωσε τον αριθμό ΕΣΛ όπως εμφανίζεται στα στοιχεία του καταλύματος.",
        "Enter the ESL number as shown in your accommodation records."
      );
    case "mag":
      return pickLocale(
        locale,
        "Συμπλήρωσε τον ΜΑΓ όπως εμφανίζεται στη γνωστοποίηση λειτουργίας.",
        "Enter the MAG number as shown on your operation notice."
      );
    default:
      return "";
  }
}

export function normalizeRegistryNumber(value: string): string {
  return value.trim().replace(/\s/g, "");
}

export function registryNeedsAdminReview(type: LegalRegistryType): boolean {
  return type === "esl" || type === "mag";
}

export function getRegistryOwnerStatus(input: {
  legalRegistryType: LegalRegistryType | string;
  amaNumber: string;
  propertyVerificationStatus?: string | null;
}): RegistryOwnerStatus {
  const type = input.legalRegistryType as LegalRegistryType;
  const number = normalizeRegistryNumber(input.amaNumber);

  if (!number || type === "none") return "empty";

  const verification = input.propertyVerificationStatus ?? "not_started";
  if (verification === "verified") return "reviewed_by_midora";
  if (verification === "needs_review" || verification === "rejected") {
    return "needs_changes";
  }

  if (!isValidRegistryNumber(type, number)) return "empty";

  if (registryNeedsAdminReview(type)) return "needs_review";
  return "filled";
}

/** @deprecated Use `getRegistryFilledStatusLabel(locale)` */
export const REGISTRY_FILLED_STATUS_LABEL = "Συμπληρώθηκε — απαιτείται βασικός έλεγχος";

export function getRegistryFilledStatusLabel(locale?: string): string {
  return pickLocale(
    locale,
    REGISTRY_FILLED_STATUS_LABEL,
    "Completed — basic review required"
  );
}

export const AADE_GUIDE_STEPS = [
  "Άνοιξε την επίσημη σελίδα της ΑΑΔΕ για βραχυχρόνια μίσθωση.",
  "Συνδέσου με τους προσωπικούς σου κωδικούς myAADE εκτός Midora.",
  "Ολοκλήρωσε τη διαδικασία έκδοσης ή εντοπισμού του αριθμού καταχώρισης.",
  "Επέστρεψε στο Midora και συμπλήρωσε τον αριθμό που αντιστοιχεί στο ακίνητό σου.",
] as const;

export const AADE_DISCLAIMER_NOTE =
  "Οι πληροφορίες παρέχονται ως γενική ενημέρωση για τη χρήση της πλατφόρμας και δεν αποτελούν φορολογική, λογιστική ή νομική συμβουλή. Το Midora δεν συνδέεται με την ΑΑΔΕ, δεν υποβάλλει δηλώσεις και δεν ζητά ή αποθηκεύει κωδικούς myAADE. Για τη σωστή συμπλήρωση, συμβουλεύσου λογιστή ή την ΑΑΔΕ.";
