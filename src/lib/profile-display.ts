import type { Profile } from "@/lib/types";

export const PROFILE_BIO_MAX = 350;

export const COMMUNICATION_LANGUAGE_OPTIONS = [
  { value: "el", label: "Ελληνικά" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Español" },
] as const;

export const PREFERRED_CONTACT_OPTIONS = [
  { value: "message", label: "Μηνύματα Midora" },
  { value: "phone", label: "Τηλέφωνο" },
  { value: "email", label: "Email" },
] as const;

export function profileDisplayName(profile: Pick<Profile, "display_name" | "full_name">): string {
  return profile.display_name?.trim() || profile.full_name?.trim() || "Χρήστης";
}

export function advertiserTypeLabel(
  type: Profile["advertiser_type"] | null | undefined
): string {
  return type === "professional" ? "Επαγγελματίας" : "Ιδιώτης";
}

export function advertiserOwnerTypeDetail(
  type: Profile["advertiser_type"] | null | undefined,
  businessName?: string | null
): string | null {
  if (type === "professional") {
    return businessName?.trim()
      ? "Επαγγελματίας / επιχείρηση"
      : "Επαγγελματίας ιδιοκτήτη";
  }
  if (type === "individual") return "Ιδιώτης ιδιοκτήτη";
  return null;
}

export function advertiserListingNote(
  type: Profile["advertiser_type"] | null | undefined,
  businessName?: string | null
): string | null {
  if (type === "professional") {
    return businessName?.trim()
      ? "Αυτή η αγγελία προσφέρεται από επιχείρηση."
      : "Αυτή η αγγελία προσφέρεται από επαγγελματία.";
  }
  if (type === "individual") {
    return "Αυτή η αγγελία προσφέρεται από ιδιώτη.";
  }
  return null;
}

export function profileJoinedYear(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

export function profileJoinedLabel(createdAt: string | null | undefined): string | null {
  const year = profileJoinedYear(createdAt);
  return year ? `Στο Midora από το ${year}` : null;
}

export function formatActiveListingsLabel(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return "1 ενεργή αγγελία";
  return `${count} ενεργές αγγελίες`;
}

export const OWNER_PUBLIC_PROFILE_NEUTRAL_BIO =
  "Ο χρήστης επικοινωνεί με ενδιαφερόμενους μέσα από το Midora για διαθεσιμότητα και λεπτομέρειες.";

export const OWNER_PUBLIC_DEFAULT_BIO =
  "Ο ιδιοκτήτης επικοινωνεί με τους ενδιαφερόμενους μέσα από το Midora για επιβεβαίωση διαθεσιμότητας και λεπτομερειών.";

export function advertiserSectionTitle(rentalMode: "short_term" | "monthly"): string {
  return rentalMode === "short_term"
    ? "Γνωρίστε τον οικοδεσπότη σας"
    : "Γνωρίστε τον ιδιοκτήτη";
}

export function formatCommunicationLanguages(codes: string[] | null | undefined): string {
  if (!codes?.length) return "";
  return codes
    .map((code) => COMMUNICATION_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code)
    .join(", ");
}
