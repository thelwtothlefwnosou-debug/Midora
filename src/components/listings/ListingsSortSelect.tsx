"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingSort } from "@/lib/types";
import { resetListingsPage } from "@/lib/listings-pagination";

const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "recommended", label: "Προτεινόμενα" },
  { value: "newest", label: "Νεότερες αγγελίες" },
  { value: "price_asc", label: "Τιμή: χαμηλότερη πρώτα" },
  { value: "price_desc", label: "Τιμή: υψηλότερη πρώτα" },
  { value: "amenities_desc", label: "Περισσότερες παροχές" },
];

type Props = {
  className?: string;
  compact?: boolean;
};

export function ListingsSortSelect({ className, compact }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") as ListingSort) || "recommended";

  function handleChange(value: string) {
    const params = resetListingsPage(new URLSearchParams(searchParams.toString()));
    if (value === "recommended") params.delete("sort");
    else params.set("sort", value);
    const q = params.toString();
    router.push(q ? `/listings?${q}` : "/listings", { scroll: false });
  }

  return (
    <label
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2",
        className
      )}
    >
      <ArrowUpDown className="h-4 w-4 shrink-0 text-gold/80" />
      {!compact && (
        <span className="hidden text-[9px] font-medium tracking-wider text-muted uppercase sm:inline">
          Ταξινόμηση
        </span>
      )}
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Ταξινόμηση αποτελεσμάτων"
        className="max-w-[9.5rem] cursor-pointer bg-transparent text-sm font-medium text-charcoal outline-none sm:max-w-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
