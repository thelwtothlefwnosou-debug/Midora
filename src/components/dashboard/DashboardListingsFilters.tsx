"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "Όλες", param: null },
  { id: "active", label: "Ενεργές", param: "active" },
  { id: "pending", label: "Σε έλεγχο", param: "pending" },
  { id: "draft", label: "Πρόχειρες", param: "draft" },
] as const;

export function DashboardListingsFilters() {
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Φίλτρο αγγελιών">
      {FILTERS.map((f) => {
        const active = current === f.id || (f.id === "all" && !searchParams.get("status"));
        const href = f.param ? `/dashboard/listings?status=${f.param}` : "/dashboard/listings";
        return (
          <Link
            key={f.id}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-gold bg-gold/10 text-charcoal"
                : "border-border text-muted hover:border-gold/40 hover:text-charcoal"
            )}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
