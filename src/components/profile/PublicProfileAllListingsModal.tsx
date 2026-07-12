"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { PublicProfileListingItem } from "@/lib/profile-public-queries";
import { PublicProfileListingCard } from "@/components/profile/PublicProfileListingCard";
import { listingRentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

type Tab = "all" | "short_term" | "monthly";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  ownedListings: PublicProfileListingItem[];
  cohostedListings: PublicProfileListingItem[];
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
};

export function PublicProfileAllListingsModal({
  open,
  onOpenChange,
  displayName,
  ownedListings,
  cohostedListings,
  interestFrom,
  interestTo,
  durationMonths,
  rentalTypeFilter,
}: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const allListings = useMemo(
    () => [...ownedListings, ...cohostedListings],
    [ownedListings, cohostedListings]
  );

  const filtered = useMemo(() => {
    if (tab === "all") return allListings;
    return allListings.filter((l) => listingRentalType(l) === tab);
  }, [allListings, tab]);

  if (!open) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "Όλα" },
    { id: "short_term", label: "Βραχυχρόνια" },
    { id: "monthly", label: "Μηνιαία" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/45 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Όλα τα ακίνητα του/της {displayName}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-charcoal"
            aria-label="Κλείσιμο"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-border px-5 py-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                tab === item.id
                  ? "bg-charcoal text-white"
                  : "bg-sand text-muted hover:text-charcoal"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Δεν υπάρχουν ακίνητα σε αυτή την κατηγορία.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((listing) => (
                <PublicProfileListingCard
                  key={`${listing.id}-${listing.profileRole}-modal`}
                  listing={listing}
                  interestFrom={interestFrom}
                  interestTo={interestTo}
                  durationMonths={durationMonths}
                  rentalTypeFilter={rentalTypeFilter}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
