/** Unified location query normalization for search + filter matching */
export function normalizeLocationQuery(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** @deprecated Use normalizeLocationQuery */
export const normalizeSearchText = normalizeLocationQuery;
