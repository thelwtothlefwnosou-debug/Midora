import type { PropertyLeadStatus } from "@/lib/types";

export const LEAD_STATUS_LABELS: Record<PropertyLeadStatus, string> = {
  new: "Νέο",
  read: "Αναγνωσμένο",
  replied: "Απαντήθηκε",
  archived: "Αρχειοθετήθηκε",
};

export function leadStatusLabel(status: PropertyLeadStatus): string {
  return LEAD_STATUS_LABELS[status] ?? status;
}

export const LEAD_DURATION_OPTIONS = [
  { value: "1plus", label: "1+ μήνας" },
  { value: "2-3", label: "2–3 μήνες" },
  { value: "4-6", label: "4–6 μήνες" },
  { value: "6-12", label: "6–12 μήνες" },
  { value: "12plus", label: "12+ μήνες" },
  { value: "other", label: "Άλλο / προς συζήτηση" },
] as const;

export function leadDurationLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const found = LEAD_DURATION_OPTIONS.find((o) => o.value === value);
  return found?.label ?? value;
}
