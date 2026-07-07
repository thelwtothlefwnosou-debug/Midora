export const ADMIN_CHANGE_REASONS = [
  { id: "photos", label: "Χρειάζονται καλύτερες φωτογραφίες" },
  { id: "missing_fields", label: "Λείπουν στοιχεία ακινήτου" },
  { id: "location", label: "Πρόβλημα με την τοποθεσία" },
  { id: "registry", label: "Πρόβλημα με τον αριθμό καταχώρισης" },
  { id: "price", label: "Λάθος ή ελλιπής τιμή" },
  { id: "description", label: "Πρόβλημα με την περιγραφή" },
  { id: "contact", label: "Πρόβλημα με στοιχεία επικοινωνίας" },
  { id: "other", label: "Άλλο" },
] as const;

export type AdminChangeReasonId = (typeof ADMIN_CHANGE_REASONS)[number]["id"];

/** @deprecated use ADMIN_CHANGE_REASONS */
export const ADMIN_CHANGE_REASON_LABELS = ADMIN_CHANGE_REASONS.map((r) => r.label);

export function formatChangeReasons(selected: string[], note: string): string {
  const labels = selected
    .map((id) => ADMIN_CHANGE_REASONS.find((r) => r.id === id)?.label)
    .filter(Boolean);
  const header = labels.length ? labels.join("; ") : "Αλλαγές";
  return note.trim() ? `[${header}]\n${note.trim()}` : `[${header}]`;
}
