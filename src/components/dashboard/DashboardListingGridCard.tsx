"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { DashboardListingCover } from "@/components/dashboard/DashboardListingCover";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import {
  ownerListingPrimaryAction,
  resolveOwnerListingUiStatus,
} from "@/lib/owner-listing-ui-status";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import { formatOwnerPropertyMeta } from "@/lib/owner-listing-card-helpers";
import {
  getFormattedListingPrice,
  getRentalTypeBadgeLabel,
  listingRentalType,
} from "@/lib/rental-types";
import { listingManageHref } from "@/lib/listing-workspace-nav";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";

type Props = {
  row: OwnerListingRowModel;
  onDeleted?: (listingId: string) => void;
};

export function DashboardListingGridCard({ row, onDeleted }: Props) {
  const locale = useLocale();
  const t = useTranslations("Owner.list");
  const tUi = useTranslations("Owner.uiStatus");
  const tCta = useTranslations("Owner.cta");
  const tListing = useTranslations("Listing");
  const tCommon = useTranslations("Common");
  const [menuOpen, setMenuOpen] = useState(false);
  const { listing, ownerStatusKey, completenessPercent, missingRequiredCount } =
    row;
  const ui = resolveOwnerListingUiStatus(row, locale);
  const primary = ownerListingPrimaryAction(row);
  const manageHref = listingManageHref(listing.id);
  const rentalType = listingRentalType(listing);
  const price = getFormattedListingPrice(listing, tCommon);
  const propertyMeta = formatOwnerPropertyMeta(row, t);
  const analytics = buildListingAnalytics(
    listing,
    row.effectiveStatus,
    ownerStatusKey,
    row.leadStats
  );
  const showMetrics =
    ui.key === "published" && hasListingPerformanceData(analytics);
  const showProgress =
    ui.key === "action_required" || ui.key === "draft" || ui.key === "ready";
  const cover = pickListingCoverPhotoUrl(listing);
  const statusLabel = tUi(ui.labelKey);
  const helperText = ui.helperValues
    ? tUi(ui.helperKey, ui.helperValues)
    : tUi(ui.helperKey);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-border bg-white shadow-soft transition-shadow hover:border-charcoal/15 hover:shadow-card">
      {/* Image — rental mode badge only */}
      <div className="relative">
        <Link
          href={manageHref}
          className="relative block aspect-[16/10] min-h-[180px] overflow-hidden sm:min-h-[200px]"
        >
          <DashboardListingCover
            src={cover}
            imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute top-2.5 left-2.5 rounded-full bg-charcoal/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
            {getRentalTypeBadgeLabel(rentalType, tListing)}
          </span>
        </Link>
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-charcoal/70 shadow-soft hover:bg-white hover:text-charcoal"
              aria-label={t("actions")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label={t("close")}
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-xl border border-border bg-white p-1.5 shadow-card">
                  <div className="px-3 py-1">
                    <DeleteListingButton
                      listingId={listing.id}
                      onDeleted={onDeleted}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <DashboardListingStatusBadge
            statusKey={ui.styleKey}
            label={statusLabel}
            helperText={null}
            compact
          />
        </div>

        <Link href={manageHref} className="block min-w-0">
          <h3 className="line-clamp-2 font-display text-[19px] font-semibold leading-snug text-charcoal group-hover:text-gold-dark">
            {listing.title}
          </h3>
          <p className="mt-1.5 text-[14px] leading-snug text-muted">
            {listing.area_display_name || listing.area},{" "}
            {listing.city_display_name || listing.city}
          </p>
        </Link>

        <p className="mt-3 font-display text-[20px] font-semibold text-charcoal">
          {price.amount && price.amount > 0 ? price.display : "—"}
        </p>
        {propertyMeta ? (
          <p className="mt-1.5 text-sm text-muted">{propertyMeta}</p>
        ) : null}

        <p className="mt-2 text-[12px] leading-snug text-muted">{helperText}</p>

        {showProgress && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-charcoal/80">
                {t("completeness")} {completenessPercent}%
              </span>
              {missingRequiredCount > 0 ? (
                <span style={{ color: "var(--owner-status-action)" }}>
                  {tUi("helperMissingCount", { count: missingRequiredCount })}
                </span>
              ) : null}
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: "var(--owner-status-draft-bg)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, completenessPercent)}%`,
                  background: "var(--owner-status-draft)",
                }}
              />
            </div>
          </div>
        )}

        {showMetrics ? (
          <p className="mt-3 text-xs text-muted">
            {t("viewsCount", {
              formatted: formatAnalyticsMetric(analytics.viewsTotal),
              count: analytics.viewsTotal ?? 0,
            })}
            {row.leadStats.total > 0
              ? t("requestsCountLine", { count: row.leadStats.total })
              : null}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <Button href={primary.href} size="sm" className="w-full">
            {tCta(primary.labelKey)}
          </Button>
          {primary.secondary ? (
            <Link
              href={primary.secondary.href}
              className="mt-2 block text-center text-xs font-medium text-charcoal/65 hover:text-gold-dark"
            >
              {tCta(primary.secondary.labelKey)}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
