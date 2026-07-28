import type { Profile } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";

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
  { value: "message", label: "Μηνύματα Midora", labelKey: "preferredContactMessage" },
  { value: "phone", label: "Τηλέφωνο", labelKey: "preferredContactPhone" },
  { value: "email", label: "Email", labelKey: "preferredContactEmail" },
] as const;

export function preferredContactLabel(
  value: (typeof PREFERRED_CONTACT_OPTIONS)[number]["value"],
  locale?: string
): string {
  const opt = PREFERRED_CONTACT_OPTIONS.find((o) => o.value === value);
  if (!opt) return value;
  if (value === "email") return "Email";
  return pickLocale(
    locale,
    opt.label,
    value === "message" ? "Midora messages" : "Phone"
  );
}

export function profileDisplayName(
  profile: Pick<Profile, "display_name" | "full_name">,
  locale?: string
): string {
  return (
    profile.display_name?.trim() ||
    profile.full_name?.trim() ||
    pickLocale(locale, "Χρήστης", "User")
  );
}

export function advertiserTypeLabel(
  type: Profile["advertiser_type"] | null | undefined,
  locale?: string
): string {
  if (type === "professional") return pickLocale(locale, "Επαγγελματίας", "Professional");
  return pickLocale(locale, "Ιδιώτης", "Individual");
}

export function advertiserOwnerTypeDetail(
  type: Profile["advertiser_type"] | null | undefined,
  businessName?: string | null,
  locale?: string
): string | null {
  if (type === "professional") {
    return businessName?.trim()
      ? pickLocale(locale, "Επαγγελματίας / επιχείρηση", "Professional / business")
      : pickLocale(locale, "Επαγγελματίας ιδιοκτήτη", "Professional owner");
  }
  if (type === "individual") return pickLocale(locale, "Ιδιώτης ιδιοκτήτη", "Individual owner");
  return null;
}

export function advertiserListingNote(
  type: Profile["advertiser_type"] | null | undefined,
  businessName?: string | null,
  locale?: string
): string | null {
  if (type === "professional") {
    return businessName?.trim()
      ? pickLocale(locale, "Αυτή η αγγελία προσφέρεται από επιχείρηση.", "This listing is offered by a business.")
      : pickLocale(locale, "Αυτή η αγγελία προσφέρεται από επαγγελματία.", "This listing is offered by a professional.");
  }
  if (type === "individual") {
    return pickLocale(locale, "Αυτή η αγγελία προσφέρεται από ιδιώτη.", "This listing is offered by an individual.");
  }
  return null;
}

export function profileJoinedYear(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

export function profileJoinedLabel(
  createdAt: string | null | undefined,
  locale?: string
): string | null {
  const year = profileJoinedYear(createdAt);
  return year
    ? pickLocale(locale, `Στο Midora από το ${year}`, `On Midora since ${year}`)
    : null;
}

export function formatActiveListingsLabel(count: number, locale?: string): string | null {
  if (count <= 0) return null;
  if (count === 1) return pickLocale(locale, "1 ενεργή αγγελία", "1 active listing");
  return pickLocale(locale, `${count} ενεργές αγγελίες`, `${count} active listings`);
}

export const OWNER_PUBLIC_PROFILE_NEUTRAL_BIO =
  "Ο χρήστης επικοινωνεί με ενδιαφερόμενους μέσα από το Midora για διαθεσιμότητα και λεπτομέρειες.";

export const OWNER_PUBLIC_DEFAULT_BIO =
  "Ο ιδιοκτήτης επικοινωνεί με τους ενδιαφερόμενους μέσα από το Midora για επιβεβαίωση διαθεσιμότητας και λεπτομερειών.";

export function advertiserSectionTitle(
  rentalMode: "short_term" | "monthly",
  locale?: string
): string {
  return rentalMode === "short_term"
    ? pickLocale(locale, "Γνωρίστε τον οικοδεσπότη σας", "Meet your host")
    : pickLocale(locale, "Γνωρίστε τον ιδιοκτήτη", "Meet the owner");
}

export function formatCommunicationLanguages(codes: string[] | null | undefined): string {
  if (!codes?.length) return "";
  return codes
    .map((code) => COMMUNICATION_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code)
    .join(", ");
}

/** next-intl translator for `Profile.public` (or compatible) messages. */
type ProfileT = (key: string, values?: Record<string, string | number>) => string;

/** i18n-aware variant of `advertiserOwnerTypeDetail` via `Profile.public` messages. */
export function getAdvertiserOwnerTypeDetail(
  type: Profile["advertiser_type"] | null | undefined,
  businessName: string | null | undefined,
  t: ProfileT
): string | null {
  if (type === "professional") {
    return businessName?.trim() ? t("professionalBusiness") : t("professionalOwner");
  }
  if (type === "individual") return t("individualOwner");
  return null;
}

/** i18n-aware variant of `advertiserListingNote` via `Profile.public` messages. */
export function getAdvertiserListingNote(
  type: Profile["advertiser_type"] | null | undefined,
  businessName: string | null | undefined,
  t: ProfileT
): string | null {
  if (type === "professional") {
    return businessName?.trim() ? t("listingByBusiness") : t("listingByProfessional");
  }
  if (type === "individual") return t("listingByIndividual");
  return null;
}

/** i18n-aware variant of `profileJoinedLabel` via `Profile.public` messages. */
export function getProfileJoinedLabel(
  createdAt: string | null | undefined,
  t: ProfileT
): string | null {
  const year = profileJoinedYear(createdAt);
  return year ? t("joinedYear", { year }) : null;
}

/** i18n-aware variant of `formatActiveListingsLabel` via `Profile.public` messages. */
export function getFormatActiveListingsLabel(count: number, t: ProfileT): string | null {
  if (count <= 0) return null;
  return t("activeListings", { count });
}

/** i18n-aware variant of `advertiserSectionTitle` via `Profile.public` messages. */
export function getAdvertiserSectionTitle(
  rentalMode: "short_term" | "monthly",
  t: ProfileT
): string {
  return rentalMode === "short_term" ? t("meetHostTitle") : t("meetOwnerTitle");
}
