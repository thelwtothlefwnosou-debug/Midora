"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { DashboardListingRow } from "@/components/dashboard/DashboardListingRow";
import { DashboardListingGridCard } from "@/components/dashboard/DashboardListingGridCard";
import { DashboardListingsSmartAlerts } from "@/components/dashboard/DashboardListingsSmartAlerts";
import {
  DashboardListingsToolbar,
  DashboardListingEmptyFiltered,
} from "@/components/dashboard/DashboardListingsToolbar";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import type {
  ListingFilterTab,
  ListingSortOption,
  OwnerListingRowModel,
} from "@/lib/owner-listings-page";
import {
  buildOwnerListingAlerts,
  countListingsByTab,
  filterByRentalType,
  filterOwnerListings,
  searchOwnerListings,
  sortOwnerListings,
} from "@/lib/owner-listings-page";
import {
  isOwnerListingWorkspacePath,
  isOwnerListingsListPath,
} from "@/lib/owner-listings-nav";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "list";

type Props = {
  rows: OwnerListingRowModel[];
  newInquiries?: number;
  isFree: boolean;
  initialTab?: ListingFilterTab;
  cohostManagedCount?: number;
};

export function DashboardListingsView({
  rows,
  newInquiries = 0,
  isFree,
  initialTab = "all",
  cohostManagedCount = 0,
}: Props) {
  const [tab, setTab] = useState<ListingFilterTab>(initialTab);
  const [search, setSearch] = useState("");
  const [rentalFilter, setRentalFilter] = useState<"all" | "short_term" | "monthly">("all");
  const [sort, setSort] = useState<ListingSortOption>("recent");
  const [view, setView] = useState<ViewMode>("list");
  const pathname = usePathname() ?? "";
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathRef.current;
    if (isOwnerListingWorkspacePath(prev) && isOwnerListingsListPath(pathname)) {
      setTab("all");
      setSearch("");
      setRentalFilter("all");
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  const tabCounts = useMemo(() => countListingsByTab(rows), [rows]);
  const alerts = useMemo(
    () => buildOwnerListingAlerts(rows, newInquiries),
    [rows, newInquiries]
  );

  const filteredRows = useMemo(() => {
    let result = filterOwnerListings(rows, tab);
    result = searchOwnerListings(result, search);
    result = filterByRentalType(result, rentalFilter);
    return sortOwnerListings(result, sort);
  }, [rows, tab, search, rentalFilter, sort]);

  const compactToolbar = rows.length <= 2;

  if (rows.length === 0) {
    const hasCohostListings = cohostManagedCount > 0;
    return (
      <DashboardEmptyState
        icon={Plus}
        title={
          hasCohostListings
            ? "Δεν έχεις δικές σου αγγελίες"
            : "Δεν έχεις ανεβάσει ακόμη αγγελία"
        }
        text={
          hasCohostListings
            ? "Οι αγγελίες που διαχειρίζεσαι ως συνοικοδεσπότης εμφανίζονται παραπάνω. Μπορείς να ανεβάσεις και δική σου αγγελία όποτε θέλεις."
            : "Δημιούργησε την πρώτη σου αγγελία και ξεκίνα να προβάλλεις το ακίνητό σου."
        }
        actionLabel={hasCohostListings ? "Ανέβασε αγγελία" : "Ανέβασε την πρώτη αγγελία"}
        actionHref={OWNER_LISTING_NEW_PATH}
        compact={hasCohostListings}
      />
    );
  }

  return (
    <div className="space-y-5">
      {alerts.length > 0 && <DashboardListingsSmartAlerts alerts={alerts} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardListingsToolbar
          tab={tab}
          tabCounts={tabCounts}
          search={search}
          rentalFilter={rentalFilter}
          sort={sort}
          onTabChange={setTab}
          onSearchChange={setSearch}
          onRentalFilterChange={setRentalFilter}
          onSortChange={setSort}
          compact={compactToolbar}
        />
        <div className="flex shrink-0 rounded-lg border border-border bg-white p-0.5 shadow-soft">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "list" ? "bg-charcoal text-white" : "text-charcoal/70 hover:bg-sand"
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView("cards")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "cards" ? "bg-charcoal text-white" : "text-charcoal/70 hover:bg-sand"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <DashboardListingEmptyFiltered
          tab={tab}
          hasAnyListings={rows.length > 0}
          onShowAll={() => {
            setTab("all");
            setSearch("");
          }}
        />
      ) : view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredRows.map((row) => (
            <DashboardListingGridCard key={row.listing.id} row={row} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <DashboardListingRow key={row.listing.id} row={row} isFree={isFree} />
          ))}
        </div>
      )}
    </div>
  );
}
