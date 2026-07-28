export const locales = ["el", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "el";
export const LOCALE_COOKIE = "midora_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "el" || value === "en";
}
