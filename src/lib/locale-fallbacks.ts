import type { Locale } from "@/i18n/config";

export function isEnglishLocale(locale?: string | null): boolean {
  return locale === "en";
}

/** Pick Greek or English string based on locale (defaults to Greek). */
export function pickLocale<T>(locale: string | undefined | null, el: T, en: T): T {
  return isEnglishLocale(locale) ? en : el;
}

/** BCP 47 tag for Intl formatters. */
export function intlLocale(locale?: string | null): string {
  return isEnglishLocale(locale) ? "en-GB" : "el-GR";
}

export type TranslateFn = (
  key: string,
  values?: Record<string, string | number>
) => string;

/** Resolve label via translator, else locale-aware static fallback. */
export function resolveLabel(
  t: TranslateFn | undefined,
  key: string,
  locale: string | undefined | null,
  el: string,
  en: string,
  values?: Record<string, string | number>
): string {
  if (t) {
    try {
      const label = t(key, values);
      if (label && !label.endsWith(`.${key}`) && label !== key) return label;
    } catch {
      /* fall through */
    }
  }
  let out = pickLocale(locale, el, en);
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      out = out.replace(`{${k}}`, String(v));
    }
  }
  return out;
}
