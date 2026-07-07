/** Quick location suggestions shown when the hero search input is empty */

export type SearchQuickSuggestion = {
  label: string;
  value: string;
  searchParams?: Record<string, string>;
};

/** Μόνο πόλεις / περιοχές — όχι φίλτρα αναζήτησης */
export const SEARCH_QUICK_SUGGESTIONS: SearchQuickSuggestion[] = [
  { label: "Αθήνα", value: "Αθήνα" },
  { label: "Θεσσαλονίκη", value: "Θεσσαλονίκη" },
  { label: "Πάτρα", value: "Πάτρα" },
  { label: "Ηράκλειο", value: "Ηράκλειο" },
  { label: "Πτολεμαΐδα", value: "Πτολεμαΐδα" },
  { label: "Λάρισα", value: "Λάρισα" },
];
