import { pickLocale } from "@/lib/locale-fallbacks";



/** Append optional house rules block to listing description (stored as single text field). */

export function appendHouseRulesToDescription(

  description: string,

  houseRules: string | null | undefined,

  locale?: string

): string {

  const rules = houseRules?.trim();

  if (!rules) return description;

  const heading = pickLocale(locale, "Κανόνες σπιτιού", "House rules");

  return `${description}\n\n${heading}:\n${rules}`;

}


