"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { DashboardListingGridCard } from "@/components/dashboard/DashboardListingGridCard";
import { DashboardListingsOverviewMetrics } from "@/components/dashboard/DashboardListingsOverviewMetrics";
import { OwnerHomeMetaStrip, OwnerHomeNextAction } from "@/components/dashboard/owner-home/OwnerHomeMetaStrip";
import { OwnerListingStatusHero } from "@/components/dashboard/owner-home/OwnerListingStatusHero";
import { OwnerProfileCompletionCompact } from "@/components/dashboard/owner-home/OwnerProfileCompletionCompact";
import { OwnerRecentActivity } from "@/components/dashboard/owner-home/OwnerRecentActivity";
import type { OwnerListingRowModel, OwnerListingsOverview } from "@/lib/owner-listings-page";
import type { PropertyLeadWithListing } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { profileCompletionItems } from "@/lib/owner-dashboard";

type Props = {
  profile: Profile;
  email: string;
  rows: OwnerListingRowModel[];
  overview: OwnerListingsOverview;
  recentLeads: PropertyLeadWithListing[];
};

function pickPrimaryRow(rows: OwnerListingRowModel[]): OwnerListingRowModel {
  return (
    rows.find((r) => r.ownerStatusKey === "review" || r.ownerStatusKey === "needs_fixes") ??
    rows.find((r) => r.ownerStatusKey === "draft") ??
    rows.find((r) => r.ownerStatusKey === "published" || r.ownerStatusKey === "paused") ??
    rows[0]
  );
}

export function OwnerHomeOverview({
  profile,
  email,
  rows,
  overview,
  recentLeads,
}: Props) {
  const t = useTranslations("Owner.home");
  const hasPublished = overview.activeCount > 0;
  const showProfileNudge = profileCompletionItems(profile, email).some((i) => !i.done);

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <OwnerHomeMetaStrip rows={rows} overview={overview} />
        <OwnerHomeNextAction rows={rows} overview={overview} />
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center shadow-soft">
          <p className="font-display text-lg font-semibold text-charcoal">
            {t("emptyTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {t("emptySubtitle")}
          </p>
          <Button href={OWNER_LISTING_NEW_PATH} className="mt-4">
            <Plus className="h-4 w-4" />
            {t("newListing")}
          </Button>
        </div>
      </div>
    );
  }

  const primaryRow = pickPrimaryRow(rows);
  const propertyTitle = rows.length === 1 ? t("yourProperty") : t("yourProperties");

  return (
    <div className="space-y-4">
      <OwnerHomeMetaStrip rows={rows} overview={overview} />
      <OwnerHomeNextAction rows={rows} overview={overview} />

      <OwnerListingStatusHero row={primaryRow} />

      {hasPublished && overview.activeCount > 0 && (
        <DashboardListingsOverviewMetrics overview={overview} />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-charcoal">{propertyTitle}</h2>
            {rows.length > 1 && (
              <Link
                href="/dashboard/listings"
                className="text-xs font-medium text-gold-dark hover:underline"
              >
                {t("allProperties")}
              </Link>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.slice(0, rows.length === 1 ? 1 : 2).map((row) => (
              <DashboardListingGridCard key={row.listing.id} row={row} />
            ))}
          </div>
        </div>

        {showProfileNudge && (
          <OwnerProfileCompletionCompact profile={profile} email={email} />
        )}
      </div>

      <OwnerRecentActivity recentLeads={recentLeads} hasPublished={hasPublished} />
    </div>
  );
}
