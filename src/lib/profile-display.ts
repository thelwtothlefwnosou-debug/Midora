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

export function formatCommunicationLanguages(codes: string[] | null | undefined): string {
  if (!codes?.length) return "";
  return codes
    .map((code) => COMMUNICATION_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code)
    .join(", ");
}
