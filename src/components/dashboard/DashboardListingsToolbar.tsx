"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Home,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListingFilterTab, ListingSortOption } from "@/lib/owner-listings-page";
import { cn } from "@/lib/utils";

const TAB_IDS: ListingFilterTab[] = [
  "all",
  "action_required",
  "draft",
  "published",
  "review",
  "inactive",
];

const TAB_KEYS: Record<
  ListingFilterTab,
  | "tabAll"
  | "tabActionRequired"
  | "tabDrafts"
  | "tabPublished"
  | "tabInReview"
  | "tabInactive"
> = {
  all: "tabAll",
  action_required: "tabActionRequired",
  draft: "tabDrafts",
  published: "tabPublished",
  review: "tabInReview",
  inactive: "tabInactive",
};

const SORT_IDS: ListingSortOption[] = ["recent", "views", "inquiries", "expiring"];

const SORT_KEYS: Record<
  ListingSortOption,
  "sortRecent" | "sortViews" | "sortInquiries" | "sortExpiring"
> = {
  recent: "sortRecent",
  views: "sortViews",
  inquiries: "sortInquiries",
  expiring: "sortExpiring",
};

type Props = {
  tab: ListingFilterTab;
  tabCounts: Record<ListingFilterTab, number>;
  search: string;
  rentalFilter: "all" | "short_term" | "monthly";
  sort: ListingSortOption;
  onTabChange: (tab: ListingFilterTab) => void;
  onSearchChange: (value: string) => void;
  onRentalFilterChange: (value: "all" | "short_term" | "monthly") => void;
  onSortChange: (value: ListingSortOption) => void;
  compact?: boolean;
};

export function DashboardListingsToolbar({
  tab,
  tabCounts,
  search,
  rentalFilter,
  sort,
  onTabChange,
  onSearchChange,
  onRentalFilterChange,
  onSortChange,
  compact = false,
}: Props) {
  const t = useTranslations("Dashboard");
  const tSearch = useTranslations("Search");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleTabs = useMemo(() => {
    if (!compact) return TAB_IDS;
    return TAB_IDS.filter((id) => id === "all" || tabCounts[id] > 0 || tab === id);
  }, [compact, tabCounts, tab]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3 shadow-soft sm:p-4">
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t("ariaStatusFilter")}
      >
        {visibleTabs.map((id) => {
          const active = tab === id;
          const count = tabCounts[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-charcoal text-white"
                  : "bg-sand/70 text-charcoal/70 hover:bg-sand hover:text-charcoal"
              )}
            >
              {t(TAB_KEYS[id])}
              {count > 0 ? (
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active ? "text-white/80" : "text-muted"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchListing")}
            className="h-9 w-full rounded-lg border border-border bg-cream/30 pr-3 pl-8 text-sm text-charcoal placeholder:text-muted focus:border-gold/40 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:bg-sand lg:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filters")}
        </button>

        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-2 lg:w-auto",
            filtersOpen ? "flex" : "hidden lg:flex"
          )}
        >
          <label className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-white px-2 text-xs">
            <span className="text-muted">{t("typeLabel")}</span>
            <select
              value={rentalFilter}
              onChange={(e) =>
                onRentalFilterChange(e.target.value as "all" | "short_term" | "monthly")
              }
              className="bg-transparent text-charcoal focus:outline-none"
            >
              <option value="all">{t("typeAll")}</option>
              <option value="short_term">{tSearch("shortTerm")}</option>
              <option value="monthly">{tSearch("monthly")}</option>
            </select>
            <ChevronDown className="h-3 w-3 text-muted" />
          </label>

          <label className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-white px-2 text-xs">
            <span className="text-muted">{t("sortLabel")}</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as ListingSortOption)}
              className="max-w-[150px] bg-transparent text-charcoal focus:outline-none"
            >
              {SORT_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(SORT_KEYS[id])}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-muted" />
          </label>
        </div>
      </div>
    </div>
  );
}

export function DashboardListingEmptyFiltered({
  tab,
  hasAnyListings,
  onShowAll,
}: {
  tab: ListingFilterTab;
  hasAnyListings: boolean;
  onShowAll?: () => void;
}) {
  const t = useTranslations("Dashboard");

  if (!hasAnyListings) return null;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center">
      <Home className="h-10 w-10 text-gold/70" />
      <p className="mt-4 font-display text-lg font-semibold text-charcoal">
        {t("emptyFilteredTitle")}
      </p>
      <p className="mt-1 text-sm text-muted">{t("emptyFilteredHint")}</p>
      {tab !== "all" && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-4 text-sm font-semibold text-gold-dark hover:underline"
        >
          {t("showAllListings")}
        </button>
      )}
    </div>
  );
}
