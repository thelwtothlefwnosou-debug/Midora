import { getAdminRegistryDisplay } from "@/lib/admin/registry-display";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminRegistryCell({
  listing,
}: {
  listing: Pick<
    Listing,
    "rental_type" | "accepts_under_60_days" | "ama_number" | "legal_registry_type"
  >;
}) {
  const display = getAdminRegistryDisplay(listing);
  const isError = display.kind === "missing" || display.kind === "required_missing";

  if (isError) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
        {display.text}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-xs",
        display.kind === "not_required" ? "text-muted" : "text-charcoal"
      )}
    >
      {display.text}
    </span>
  );
}
