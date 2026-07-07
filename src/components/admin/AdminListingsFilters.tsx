"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "Όλες" },
  { value: "active", label: "Ενεργές" },
  { value: "pending", label: "Σε έλεγχο" },
  { value: "needs_changes", label: "Χρειάζονται αλλαγές" },
  { value: "rejected", label: "Απορριφθείσες" },
  { value: "hidden", label: "Κρυφές" },
];

const RENTAL_TABS = [
  { value: "", label: "Όλοι οι τύποι" },
  { value: "short_term", label: "Βραχυχρόνια" },
  { value: "monthly", label: "Μηνιαία" },
  { value: "long_term", label: "Μακροχρόνια" },
];

const QUICK_FILTERS = [
  { value: "needs_review", label: "Χρειάζεται έλεγχος" },
  { value: "high_priority", label: "Υψηλή προτεραιότητα" },
  { value: "no_photos", label: "Χωρίς φωτογραφίες" },
  { value: "unverified_phone", label: "Μη επαληθευμένο τηλ." },
  { value: "with_reports", label: "Με αναφορές" },
  { value: "needs_changes", label: "Χρειάζονται αλλαγές" },
] as const;

type FilterParams = {
  status?: string;
  rentalType?: string;
  search?: string;
  registry?: string;
  filter?: string;
  quick?: string;
};

function buildHref(base: FilterParams, overrides: Partial<FilterParams>): string {
  const merged = { ...base, ...overrides };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `/admin/listings?${s}` : "/admin/listings";
}

export function AdminListingsFilters({ params }: { params: FilterParams }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current: FilterParams = {
    status: searchParams.get("status") ?? params.status ?? "",
    rentalType: searchParams.get("rentalType") ?? params.rentalType ?? "",
    search: searchParams.get("search") ?? params.search ?? "",
    registry: searchParams.get("registry") ?? params.registry ?? "",
    filter: searchParams.get("filter") ?? params.filter ?? "",
    quick: searchParams.get("quick") ?? params.quick ?? "",
  };

  const navigate = useCallback(
    (overrides: Partial<FilterParams>) => {
      const href = buildHref(current, overrides);
      startTransition(() => {
        router.push(href);
      });
    },
    [current, router]
  );

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate({ search: (fd.get("search") as string) || undefined });
        }}
      >
        <input
          name="search"
          key={current.search}
          defaultValue={current.search}
          placeholder="Αναζήτηση τίτλου, περιοχής, email, ΑΜΑ…"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-charcoal px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          Αναζήτηση
        </button>
        {(current.search || current.status || current.rentalType || current.registry || current.filter || current.quick) && (
          <Link
            href="/admin/listings"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2 text-sm text-muted hover:text-charcoal"
          >
            Καθαρισμός
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildHref(current, { status: tab.value || undefined, quick: undefined })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              (current.status ?? "") === tab.value
                ? "bg-gold text-white"
                : "border border-border bg-white text-muted hover:border-gold/30"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {RENTAL_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildHref(current, { rentalType: tab.value || undefined })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              (current.rentalType ?? "") === tab.value
                ? "bg-charcoal text-white"
                : "border border-border bg-white text-muted hover:border-charcoal/30"
            )}
          >
            {tab.label}
          </Link>
        ))}
        <Link
          href={buildHref(current, { registry: current.registry === "with" ? undefined : "with" })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            current.registry === "with"
              ? "bg-charcoal text-white"
              : "border border-border bg-white text-muted"
          )}
        >
          Με ΑΜΑ/ΕΣΛ/ΜΑΓ
        </Link>
        <Link
          href={buildHref(current, { registry: current.registry === "without" ? undefined : "without" })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            current.registry === "without"
              ? "bg-charcoal text-white"
              : "border border-border bg-white text-muted"
          )}
        >
          Χωρίς ΑΜΑ/ΕΣΛ/ΜΑΓ
        </Link>
        <Link
          href={buildHref(current, { filter: current.filter === "location" ? undefined : "location", quick: undefined })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            current.filter === "location"
              ? "bg-amber-600 text-white"
              : "border border-border bg-white text-muted"
          )}
        >
          Θέματα τοποθεσίας
        </Link>
        <Link
          href={buildHref(current, { filter: current.filter === "incomplete" ? undefined : "incomplete", quick: undefined })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            current.filter === "incomplete"
              ? "bg-amber-600 text-white"
              : "border border-border bg-white text-muted"
          )}
        >
          Ελλιπείς
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-muted">Γρήγορα φίλτρα:</span>
        {QUICK_FILTERS.map((qf) => (
          <Link
            key={qf.value}
            href={buildHref(current, {
              quick: current.quick === qf.value ? undefined : qf.value,
              filter: undefined,
            })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              current.quick === qf.value
                ? "bg-gold/20 text-gold-dark ring-1 ring-gold/40"
                : "border border-border bg-white text-muted hover:border-gold/25"
            )}
          >
            {qf.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
