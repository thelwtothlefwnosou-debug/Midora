"use client";

import Link from "next/link";
import {
  Eye,
  CalendarDays,
  Pencil,
  ExternalLink,
  Camera,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Link2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { AadeGuideHelperCard } from "@/components/aade/AadeGuideHelperCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import type { ListingWorkspaceContext } from "@/lib/listing-workspace-types";
import type { PropertyLeadWithListing } from "@/lib/types";
import { listingNeedsCompletenessPanel } from "@/lib/owner-listings-page";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { getFormattedListingPrice } from "@/lib/rental-types";
import { getListingPublicId } from "@/lib/utils";
import {
  resolveOwnerListingUiStatus,
} from "@/lib/owner-listing-ui-status";
import { buildOwnerListingRowModel } from "@/lib/owner-listings-page";

type Props = {
  ctx: ListingWorkspaceContext;
  recentLeads?: PropertyLeadWithListing[];
  externalLinkCount?: number;
};

function activeUntilLabel(
  ctx: ListingWorkspaceContext,
  t: ReturnType<typeof useTranslations<"Workspace.overview">>,
  dateLocale: string
): { text: string; tone: string } | null {
  const { listing, ownerStatusKey } = ctx;
  if (
    ownerStatusKey !== "published" &&
    ownerStatusKey !== "paused" &&
    ownerStatusKey !== "expired"
  ) {
    return null;
  }

  if (!listing.expires_at) {
    return { text: t("activeNoExpiry"), tone: "text-charcoal/80" };
  }

  const days = Math.ceil(
    (new Date(listing.expires_at).getTime() - Date.now()) / 86400000
  );
  const formatted = formatOwnerListingDate(listing.expires_at, dateLocale);

  if (days < 0) {
    return {
      text: formatted ? t("expiredOn", { date: formatted }) : t("expired"),
      tone: "text-charcoal/60",
    };
  }
  if (days <= 6) {
    return {
      text:
        days === 1
          ? t("expiresInDay", { count: days })
          : t("expiresInDays", { count: days }),
      tone: "text-orange-700",
    };
  }
  if (days <= 14) {
    return {
      text: formatted
        ? t("activeUntil", { date: formatted })
        : t("expiresInDays", { count: days }),
      tone: "text-gold-dark",
    };
  }
  return {
    text: formatted ? t("activeUntil", { date: formatted }) : t("active"),
    tone: "text-teal",
  };
}

function nextAction(
  ctx: ListingWorkspaceContext,
  t: ReturnType<typeof useTranslations<"Workspace.overview">>
): { label: string; href: string } | null {
  const { listing, ownerStatusKey } = ctx;
  const id = listing.id;

  switch (ownerStatusKey) {
    case "draft":
      return { label: t("continueDraft"), href: `/dashboard/listings/new?draft=${id}` };
    case "needs_fixes":
      return { label: t("fixListing"), href: `/dashboard/listings/${id}/edit` };
    case "review":
      return { label: t("seePublishStatus"), href: `/dashboard/listings/${id}/publish` };
    case "expired":
      return { label: t("renewListing"), href: `/dashboard/listings/${id}/pay` };
    case "published":
    case "paused":
      return { label: t("manageCalendar"), href: `/dashboard/listings/${id}/availability` };
    default:
      return null;
  }
}

export function ListingOverviewPanel({
  ctx,
  recentLeads = [],
  externalLinkCount = 0,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("Workspace.overview");
  const tUi = useTranslations("Owner.uiStatus");
  const tCommon = useTranslations("Common");
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  const { listing, ownerStatusKey, photoCount, rentalType } = ctx;
  const row = buildOwnerListingRowModel(listing, ctx.effectiveStatus);
  const ui = resolveOwnerListingUiStatus(row, locale);
  const statusLabel = tUi(ui.labelKey);
  const analytics = buildListingAnalytics(
    listing,
    ctx.effectiveStatus,
    ownerStatusKey
  );
  const lifecycle = activeUntilLabel(ctx, t, dateLocale);
  const action = nextAction(ctx, t);
  const publicId = getListingPublicId(listing);

  const showCompleteness = listingNeedsCompletenessPanel(ownerStatusKey);
  const hasPerformance = hasListingPerformanceData(analytics);
  const price = getFormattedListingPrice(listing, tCommon);
  const isShortTerm = rentalType === "short_term";
  const showTrustRecommendation = externalLinkCount === 0;

  return (
    <div className="space-y-4">
      {showTrustRecommendation && (
        <section className="rounded-xl border border-gold/30 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gold-dark">
                <Link2 className="h-3.5 w-3.5" />
                {t("recommendation")}
              </p>
              <h3 className="mt-1 font-display text-sm font-semibold text-charcoal">
                {t("trustTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted">{t("trustBody")}</p>
            </div>
            <Button href={`/dashboard/listings/${listing.id}/trust-links`} size="sm">
              {t("add")}
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {t("listingStatus")}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-charcoal">
            {statusLabel}
          </p>
          {lifecycle && (
            <p className={`mt-1 text-sm font-medium ${lifecycle.tone}`}>{lifecycle.text}</p>
          )}
          {action && (
            <Link
              href={action.href}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-dark hover:text-charcoal"
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {t("performance")}
          </p>
          {hasPerformance ? (
            <div className="mt-2 flex flex-wrap gap-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Eye className="h-3 w-3" />
                  {t("views")}
                </p>
                <p className="font-display text-2xl font-semibold tabular-nums text-charcoal">
                  {formatAnalyticsMetric(analytics.viewsTotal)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MessageSquare className="h-3 w-3" />
                  {t("requests")}
                </p>
                <p className="font-display text-2xl font-semibold tabular-nums text-charcoal">
                  {recentLeads.length}
                </p>
              </div>
            </div>
          ) : (
            <DashboardEmptyState
              compact
              icon={BarChart3}
              title={t("noStatsTitle")}
              text={t("noStatsBody")}
              className="mt-2 border-0 bg-transparent px-0 py-0"
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {t("availability")}
            </p>
            {isShortTerm ? (
              <>
                <p className="mt-1 text-sm text-charcoal">
                  {listing.price_per_night
                    ? t("basePriceNight", {
                        price: listing.price_per_night.toLocaleString(dateLocale),
                      })
                    : t("basePriceDash")}
                </p>
                <p className="mt-0.5 text-xs text-muted">{t("calendarHint")}</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold text-charcoal">
                  {price.amount && price.amount > 0 ? price.display : "—"}
                </p>
                {listing.available_from && (
                  <p className="mt-0.5 text-xs text-muted">
                    {t("availableFrom", {
                      date: formatOwnerListingDate(listing.available_from, dateLocale) ?? "",
                    })}
                  </p>
                )}
              </>
            )}
          </div>
          <Button
            href={`/dashboard/listings/${listing.id}/availability`}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {isShortTerm ? t("calendar") : t("availability")}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-charcoal">
            {t("recentRequests")}
          </h3>
          {recentLeads.length > 0 && (
            <Link
              href={`/dashboard/listings/${listing.id}/inquiries`}
              className="text-xs font-medium text-gold-dark hover:text-charcoal"
            >
              {t("all")}
            </Link>
          )}
        </div>
        {recentLeads.length === 0 ? (
          <DashboardEmptyState
            compact
            icon={MessageSquare}
            title={t("noRequestsTitle")}
            text={t("noRequestsBody")}
            className="mt-3"
          />
        ) : (
          <div className="mt-3 space-y-2">
            {recentLeads.slice(0, 3).map((lead) => (
              <PropertyLeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </section>

      {showCompleteness ? (
        <div className="space-y-3">
          <ListingCompletenessCard listing={listing} photoCount={photoCount} />
          <AadeGuideHelperCard
            variant="dashboard"
            defaultTab={isShortTerm ? "short_term" : "monthly"}
          />
        </div>
      ) : (
        <AadeGuideHelperCard
          variant="dashboard"
          defaultTab={isShortTerm ? "short_term" : "monthly"}
        />
      )}

      <section className="rounded-xl border border-border bg-white p-4 shadow-soft">
        <h3 className="font-display text-sm font-semibold text-charcoal">{t("quickActions")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button href={`/dashboard/listings/${listing.id}/edit`} size="sm" variant="outline">
            <Pencil className="h-3.5 w-3.5" />
            {t("edit")}
          </Button>
          <Button
            href={`/dashboard/listings/${listing.id}/trust-links`}
            size="sm"
            variant="outline"
          >
            <Link2 className="h-3.5 w-3.5" />
            {t("trust")}
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/photos`} size="sm" variant="outline">
            <Camera className="h-3.5 w-3.5" />
            {t("photos")}
          </Button>
          <Button
            href={`/dashboard/listings/${listing.id}/availability`}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {t("availability")}
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/view`} size="sm" variant="outline">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("preview")}
          </Button>
          {(ownerStatusKey === "published" || ownerStatusKey === "paused") && (
            <Button href={`/listings/${publicId}`} size="sm" variant="outline">
              {t("publicPage")}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
