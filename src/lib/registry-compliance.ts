import type { LegalRegistryType } from "@/lib/types";
import { isValidRegistryNumber } from "@/lib/listing-wizard-validation";

/** Official AADE informational page — opens in new tab only. */
export const AADE_SHORT_TERM_REGISTRY_URL =
  "https://www.aade.gr/brahyhronia-misthosi-akiniton";

export type RegistryOwnerStatus =
  | "empty"
  | "filled"
  | "needs_review"
  | "reviewed_by_midora"
  | "needs_changes";

export const REGISTRY_OWNER_STATUS_LABELS: Record<RegistryOwnerStatus, string> = {
  empty: "Δεν έχει συμπληρωθεί",
  filled: "Συμπληρώθηκε",
  needs_review: "Χρειάζεται έλεγχο",
  reviewed_by_midora: "Ελέγχθηκε από Midora",
  needs_changes: "Χρειάζονται αλλαγές",
};

export function getRegistryHelperText(type: LegalRegistryType): string {
  switch (type) {
    case "ama":
      return "Συμπλήρωσε τον 11ψήφιο ΑΜΑ χωρίς κενά.";
    case "esl":
      return "Συμπλήρωσε τον αριθμό ΕΣΛ όπως εμφανίζεται στα στοιχεία του καταλύματος.";
    case "mag":
      return "Συμπλήρωσε τον ΜΑΓ όπως εμφανίζεται στη γνωστοποίηση λειτουργίας.";
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

export const REGISTRY_FILLED_STATUS_LABEL = "Συμπληρώθηκε — απαιτείται βασικός έλεγχος";

export const AADE_GUIDE_STEPS = [
  "Άνοιξε την επίσημη σελίδα της ΑΑΔΕ για βραχυχρόνια μίσθωση.",
  "Συνδέσου με τους προσωπικούς σου κωδικούς myAADE εκτός Midora.",
  "Ολοκλήρωσε τη διαδικασία έκδοσης ή εντοπισμού του αριθμού καταχώρισης.",
  "Επέστρεψε στο Midora και συμπλήρωσε τον αριθμό που αντιστοιχεί στο ακίνητό σου.",
] as const;

export const AADE_DISCLAIMER_NOTE =
  "Το Midora δεν συνδέεται με την ΑΑΔΕ και δεν ζητά ή αποθηκεύει κωδικούς myAADE.";
