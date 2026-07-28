import { pickLocale } from "@/lib/locale-fallbacks";

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

const HEATING_VALUE_KEYS = [
  "central",
  "natural_gas",
  "oil",
  "electric",
  "heat_pump",
  "none",
] as const;

type LabelsT = (key: string, values?: Record<string, string | number>) => string;

const HEATING_LABELS_EN: Record<string, string> = {
  central: "Central",
  natural_gas: "Natural gas",
  oil: "Oil",
  electric: "Electric",
  heat_pump: "Heat pump",
  none: "No heating",
};

export function heatingTypeLabel(value: string | null | undefined, locale?: string): string {
  if (!value) return "—";
  if (HEATING_LABELS_EN[value]) {
    return pickLocale(locale, HEATING_TYPES.find((h) => h.value === value)?.label ?? value, HEATING_LABELS_EN[value]);
  }
  return HEATING_TYPES.find((h) => h.value === value)?.label ?? value;
}

export function energyClassLabel(value: string | null | undefined, locale?: string): string {
  if (!value) return "—";
  if (value === "unknown") return pickLocale(locale, "Άγνωστη", "Unknown");
  return ENERGY_CLASSES.find((e) => e.value === value)?.label ?? value;
}

/** Localized heating label via `Listing.labels.heating.*` when `t` is provided. */
export function getHeatingTypeLabel(
  value: string | null | undefined,
  t?: LabelsT,
  locale?: string
): string {
  if (!value) return "—";
  if (t && (HEATING_VALUE_KEYS as readonly string[]).includes(value)) {
    return t(`heating.${value}`);
  }
  return heatingTypeLabel(value, locale);
}

/** Localized energy class via `Listing.labels` when `t` is provided. */
export function getEnergyClassLabel(
  value: string | null | undefined,
  t?: LabelsT,
  locale?: string
): string {
  if (!value) return "—";
  if (value === "unknown") {
    return t ? t("energyClassUnknown") : energyClassLabel(value, locale);
  }
  return ENERGY_CLASSES.find((e) => e.value === value)?.label ?? value;
}
