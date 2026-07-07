export const HEATING_TYPES = [
  { value: "", label: "—" },
  { value: "central", label: "Κεντρική" },
  { value: "natural_gas", label: "Φυσικό αέριο" },
  { value: "oil", label: "Πετρέλαιο" },
  { value: "electric", label: "Ιοντική" },
  { value: "heat_pump", label: "Αντλία θερμότητας" },
  { value: "none", label: "Χωρίς θέρμανση" },
] as const;

export const ENERGY_CLASSES = [
  { value: "", label: "—" },
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G" },
  { value: "unknown", label: "Άγνωστη" },
] as const;

export function heatingTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return HEATING_TYPES.find((h) => h.value === value)?.label ?? value;
}

export function energyClassLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return ENERGY_CLASSES.find((e) => e.value === value)?.label ?? value;
}
