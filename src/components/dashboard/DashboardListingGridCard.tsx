"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import {
  formatOwnerPropertyMeta,
  ownerListingLifecycle,
} from "@/lib/owner-listing-card-helpers";
import {
  formatListingPrice,
  listingRentalType,
  rentalTypeBadgeLabel,
} from "@/lib/rental-types";
import { listingManageHref } from "@/lib/listing-workspace-nav";
import { cn } from "@/lib/utils";

type Props = {
  row: OwnerListingRowModel;
};

export function DashboardListingGridCard({ row }: Props) {
  const { listing, effectiveStatus, ownerStatusKey, completenessPercent } = row;
  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const lifecycle = ownerListingLifecycle(row);
  const manageHref = listingManageHref(listing.id);
  const rentalType = listingRentalType(listing);
  const price = formatListingPrice(listing);
  const propertyMeta = formatOwnerPropertyMeta(row);
  const analytics = buildListingAnalytics(listing, effectiveStatus, ownerStatusKey, row.leadStats);
  const showMetrics =
    (ownerStatusKey === "published" || ownerStatusKey === "paused") &&
    hasListingPerformanceData(analytics);
  const isReview = ownerStatusKey === "review" || ownerStatusKey === "needs_fixes";
  const isDraft = ownerStatusKey === "draft";

  const images = listing.listing_images ?? [];
  const cover = images.find((i) => i.media_type !== "video")?.url;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-shadow hover:shadow-card">
      <Link href={manageHref} className="relative block aspect-[16/10] overflow-hidden bg-sand/40">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- avoid next/image hostname crashes blanking dashboard
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <span className="text-xs">Χωρίς φωτογραφία</span>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-md bg-charcoal/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
          {rentalTypeBadgeLabel(rentalType)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <DashboardListingStatusBadge
            statusKey={ownerStatusKey}
            label={ownerStatus.label}
          />
        </div>

        <Link href={manageHref} className="block min-w-0">
          <h3 className="line-clamp-2 font-display text-lg font-semibold text-charcoal group-hover:text-gold-dark">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {listing.area_display_name || listing.area}, {listing.city_display_name || listing.city}
          </p>
        </Link>

        <p className="mt-2 font-display text-xl font-semibold text-charcoal">
          {price.amount && price.amount > 0 ? price.display : "—"}
        </p>
        {propertyMeta ? <p className="mt-1 text-xs text-muted">{propertyMeta}</p> : null}

        <div className="mt-3 flex-1">
          {isReview ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-charcoal">{lifecycle.text}</p>
              <p className="text-muted">Αναμονή ελέγχου</p>
            </div>
          ) : isDraft ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">{lifecycle.text}</p>
              {completenessPercent < 100 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${completenessPercent}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p
              className={cn(
                "text-sm",
                lifecycle.tone === "green" && "text-teal",
                lifecycle.tone === "amber" && "text-gold-dark",
                lifecycle.tone === "warning" && "text-orange-700",
                lifecycle.tone === "expired" && "text-charcoal/60",
                lifecycle.tone === "neutral" && "text-muted"
              )}
            >
              {lifecycle.text}
            </p>
          )}

          {showMetrics && (
            <p className="mt-2 text-xs text-muted">
              {formatAnalyticsMetric(analytics.viewsTotal)} προβολές
              {row.leadStats.total > 0 && ` · ${row.leadStats.total} αιτήματα`}
            </p>
          )}
        </div>

        <Button href={manageHref} size="sm" className="mt-4 w-full">
          Διαχείριση ακινήτου
        </Button>
      </div>
    </article>
  );
}
