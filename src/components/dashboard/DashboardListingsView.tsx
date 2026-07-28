"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardListingRow } from "@/components/dashboard/DashboardListingRow";
import { DashboardListingGridCard } from "@/components/dashboard/DashboardListingGridCard";
import { DashboardListingsActionPanel } from "@/components/dashboard/DashboardListingsActionPanel";
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
  buildOwnerActionRequiredItems,
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
  const t = useTranslations("Dashboard");
  const tNotif = useTranslations("Owner.notifications");
  const tAlerts = useTranslations("Owner.alerts");
  const [localRows, setLocalRows] = useState(rows);
  const [tab, setTab] = useState<ListingFilterTab>(initialTab);
  const [search, setSearch] = useState("");
  const [rentalFilter, setRentalFilter] = useState<"all" | "short_term" | "monthly">(
    "all"
  );
  const [sort, setSort] = useState<ListingSortOption>("recent");
  /** Cards default — status must be obvious at a glance. */
  const [view, setView] = useState<ViewMode>("cards");
  const pathname = usePathname() ?? "";
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  useEffect(() => {
    const prev = prevPathRef.current;
    if (isOwnerListingWorkspacePath(prev) && isOwnerListingsListPath(pathname)) {
      setTab("all");
      setSearch("");
      setRentalFilter("all");
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  function handleDeleted(listingId: string) {
    setLocalRows((prev) => prev.filter((row) => row.listing.id !== listingId));
  }

  const tabCounts = useMemo(() => countListingsByTab(localRows), [localRows]);
  const actionItems = useMemo(
    () => buildOwnerActionRequiredItems(localRows),
    [localRows]
  );

  const filteredRows = useMemo(() => {
    let result = filterOwnerListings(localRows, tab);
    result = searchOwnerListings(result, search);
    result = filterByRentalType(result, rentalFilter);
    return sortOwnerListings(result, sort);
  }, [localRows, tab, search, rentalFilter, sort]);

  const compactToolbar = localRows.length <= 2;

  if (localRows.length === 0) {
    const hasCohostListings = cohostManagedCount > 0;
    return (
      <DashboardEmptyState
        icon={Plus}
        title={
          hasCohostListings ? t("emptyListingsCohostTitle") : t("emptyListingsTitle")
        }
        text={
          hasCohostListings ? t("emptyListingsCohostText") : t("emptyListingsText")
        }
        actionLabel={
          hasCohostListings ? t("uploadListing") : t("uploadFirstListing")
        }
        actionHref={OWNER_LISTING_NEW_PATH}
        compact={hasCohostListings}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Status summary — neutral overview; listing badges keep status colors */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <SummaryChip
          label={t("tabPublished")}
          value={tabCounts.published}
          onClick={() => setTab("published")}
          active={tab === "published"}
        />
        <SummaryChip
          label={t("tabDrafts")}
          value={tabCounts.draft}
          onClick={() => setTab("draft")}
          active={tab === "draft"}
        />
        <SummaryChip
          label={t("tabActionRequired")}
          value={tabCounts.action_required}
          onClick={() => setTab("action_required")}
          active={tab === "action_required"}
        />
        <SummaryChip
          label={t("tabInReview")}
          value={tabCounts.review}
          onClick={() => setTab("review")}
          active={tab === "review"}
        />
      </div>

      {/* ONE action panel — never one banner per listing */}
      {actionItems.length > 0 ? (
        <DashboardListingsActionPanel
          items={actionItems}
          onShowAll={() => {
            setTab("action_required");
            setSearch("");
          }}
        />
      ) : null}

      {newInquiries > 0 ? (
        <p className="text-sm text-charcoal/70">
          {newInquiries === 1
            ? tNotif("newInterestBodyOne")
            : tNotif("newInterestBodyMany", { count: newInquiries })}{" "}
          <Link
            href="/dashboard/requests"
            className="font-semibold text-gold-dark hover:underline"
          >
            {tAlerts("newInterestCta")}
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
        </div>
        <div className="flex shrink-0 rounded-lg border border-border bg-white p-0.5 shadow-soft">
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
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <DashboardListingEmptyFiltered
          tab={tab}
          hasAnyListings={localRows.length > 0}
          onShowAll={() => {
            setTab("all");
            setSearch("");
          }}
        />
      ) : view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredRows.map((row) => (
            <DashboardListingGridCard
              key={row.listing.id}
              row={row}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <DashboardListingRow
              key={row.listing.id}
              row={row}
              isFree={isFree}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  onClick,
  active,
}: {
  label: string;
  value: number;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = cn(
    "rounded-xl border border-border bg-white px-3 py-2.5 text-left shadow-soft transition-colors sm:px-4",
    onClick && "cursor-pointer hover:bg-sand/35 hover:shadow-md",
    active && "border-charcoal/25 bg-sand/25 ring-1 ring-charcoal/15"
  );

  const body = (
    <>
      <p className="text-[10px] font-semibold tracking-wide text-charcoal/55 uppercase sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-charcoal sm:text-2xl">
        {value}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
