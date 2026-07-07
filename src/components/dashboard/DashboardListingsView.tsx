"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardListingRow } from "@/components/dashboard/DashboardListingRow";
import { DashboardListingsOverviewMetrics } from "@/components/dashboard/DashboardListingsOverviewMetrics";
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
  buildOwnerListingsOverview,
  countListingsByTab,
  filterByRentalType,
  filterOwnerListings,
  searchOwnerListings,
  sortOwnerListings,
} from "@/lib/owner-listings-page";

type Props = {
  rows: OwnerListingRowModel[];
  newInquiries: number;
  isFree: boolean;
  initialTab?: ListingFilterTab;
};

export function DashboardListingsView({
  rows,
  newInquiries,
  isFree,
  initialTab = "all",
}: Props) {
  const [tab, setTab] = useState<ListingFilterTab>(initialTab);
  const [search, setSearch] = useState("");
  const [rentalFilter, setRentalFilter] = useState<"all" | "short_term" | "monthly">("all");
  const [sort, setSort] = useState<ListingSortOption>("recent");

  const tabCounts = useMemo(() => countListingsByTab(rows), [rows]);
  const overview = useMemo(
    () => buildOwnerListingsOverview(rows, newInquiries),
    [rows, newInquiries]
  );
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
    return (
      <DashboardEmptyState
        icon={Plus}
        title="Δεν έχεις ανεβάσει ακόμη αγγελία"
        text="Δημιούργησε την πρώτη σου αγγελία και ξεκίνα να δέχεσαι αιτήματα ενδιαφέροντος."
        actionLabel="Ανέβασε την πρώτη αγγελία"
        actionHref={OWNER_LISTING_NEW_PATH}
      />
    );
  }

  const hasPublished = tabCounts.published > 0;

  return (
    <div className="space-y-5">
      <DashboardListingsOverviewMetrics overview={overview} />
      <DashboardListingsSmartAlerts alerts={alerts} />

      {!hasPublished && rows.length > 0 && (
        <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted">
          Οι αγγελίες σου δεν είναι ακόμη δημοσιευμένες.
        </p>
      )}

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

      {filteredRows.length === 0 ? (
        <DashboardListingEmptyFiltered
          tab={tab}
          hasAnyListings={rows.length > 0}
          onShowAll={() => {
            setTab("all");
            setSearch("");
          }}
        />
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
