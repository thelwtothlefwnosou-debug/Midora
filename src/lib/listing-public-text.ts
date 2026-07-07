const BLOCKED_TEXT_PATTERNS = [
  /pexels/i,
  /\bdemo\b/i,
  /test\s*listing/i,
  /\bplaceholder\b/i,
  /οι φωτογραφίες είναι πραγματικές/i,
  /lorem\s+ipsum/i,
  /\.env/i,
  /supabase\s+key/i,
];

const BLOCKED_HIGHLIGHT_PATTERNS = [
  /κορυφαίο/i,
  /εγγυημένο/i,
  /guaranteed/i,
  /top\s*rated/i,
  /superhost/i,
  ...BLOCKED_TEXT_PATTERNS,
];

export function sanitizePublicListingText(text: string | null | undefined): string {
  if (!text?.trim()) return "";

  const withoutRules = text.split(/\n\nΚανόνες σπιτιού:/)[0]?.trim() ?? text.trim();
  const joined = withoutRules.trim();
  if (!joined) return "";

  if (BLOCKED_TEXT_PATTERNS.some((re) => re.test(joined))) {
    const lines = joined
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !BLOCKED_TEXT_PATTERNS.some((re) => re.test(line)));
    const recovered = lines.join("\n").trim();
    return recovered || joined;
  }

  return joined;
}

export function isValidPublicHighlightLabel(label: string | null | undefined): boolean {
  const value = label?.trim() ?? "";
  if (value.length < 2) return false;
  return !BLOCKED_HIGHLIGHT_PATTERNS.some((re) => re.test(value));
}
