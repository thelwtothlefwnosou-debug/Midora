import type { PropertyLeadStatus } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";

/** @deprecated Use `leadStatusKey` + `Owner.leads` in UI */
export const LEAD_STATUS_LABELS: Record<PropertyLeadStatus, string> = {
  new: "Νέο",
  read: "Αναγνωσμένο",
  replied: "Απαντήθηκε",
  archived: "Αρχειοθετήθηκε",
};

const LEAD_STATUS_LABELS_EN: Record<PropertyLeadStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

const LEAD_STATUS_KEYS: Record<PropertyLeadStatus, string> = {
  new: "statusNew",
  read: "statusRead",
  replied: "statusReplied",
  archived: "statusArchived",
};

export function leadStatusLabel(
  status: PropertyLeadStatus,
  locale?: string
): string {
  return pickLocale(locale, LEAD_STATUS_LABELS[status] ?? status, LEAD_STATUS_LABELS_EN[status] ?? status);
}

/** next-intl key under `Owner.leads` for lead status. */
export function leadStatusKey(status: PropertyLeadStatus): string {
  return LEAD_STATUS_KEYS[status] ?? "statusNew";
}

export const LEAD_DURATION_OPTIONS = [
  { value: "1plus", label: "1+ μήνας", labelKey: "duration1plus" },
  { value: "2-3", label: "2–3 μήνες", labelKey: "duration2_3" },
  { value: "4-6", label: "4–6 μήνες", labelKey: "duration4_6" },
  { value: "6-12", label: "6–12 μήνες", labelKey: "duration6_12" },
  { value: "12plus", label: "12+ μήνες", labelKey: "duration12plus" },
  { value: "other", label: "Άλλο / προς συζήτηση", labelKey: "durationOther" },
] as const;

const LEAD_DURATION_FALLBACK_EN: Record<string, string> = {
  "1plus": "1+ month",
  "2-3": "2–3 months",
  "4-6": "4–6 months",
  "6-12": "6–12 months",
  "12plus": "12+ months",
  other: "Other / to discuss",
};

const LEAD_DURATION_KEYS: Record<string, string> = {
  "1plus": "duration1plus",
  "2-3": "duration2_3",
  "4-6": "duration4_6",
  "6-12": "duration6_12",
  "12plus": "duration12plus",
  other: "durationOther",
};

export function leadDurationLabel(
  value: string | null | undefined,
  locale?: string
): string {
  if (!value) return "—";
  const found = LEAD_DURATION_OPTIONS.find((o) => o.value === value);
  if (found && LEAD_DURATION_FALLBACK_EN[value]) {
    return pickLocale(locale, found.label, LEAD_DURATION_FALLBACK_EN[value]);
  }
  return found?.label ?? value;
}

/** next-intl key under `Owner.leads` for duration, or null if unknown. */
export function leadDurationKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return LEAD_DURATION_KEYS[value] ?? null;
}
