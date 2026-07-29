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
  CircleCheck,
  CircleDashed,
  Banknote,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { AadeGuideHelperCard } from "@/components/aade/AadeGuideHelperCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PropertyLeadRow } from "@/components/dashboard/PropertyLeadRow";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import { ListingContinueCompletionCard } from "@/components/dashboard/listing-workspace/ListingContinueCompletionCard";
import { WorkspaceSectionCard } from "@/components/dashboard/listing-workspace/WorkspaceSectionCard";
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
  ownerListingContinueWizardHref,
  listingNeedsContinueCompletion,
} from "@/lib/owner-listing-ui-status";
import { buildOwnerListingRowModel } from "@/lib/owner-listings-page";
import { cn } from "@/lib/utils";

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
  t: ReturnType<typeof useTranslations<"Workspace.overview">>,
  row: ReturnType<typeof buildOwnerListingRowModel>
): { label: string; href: string } | null {
  const { listing, ownerStatusKey } = ctx;
  const id = listing.id;

  if (listingNeedsContinueCompletion(row)) {
    return {
      label:
        ownerStatusKey === "needs_fixes" ? t("fixListing") : t("continueDraft"),
      href: ownerListingContinueWizardHref(id),
    };
  }

  switch (ownerStatusKey) {
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
  const tContinue = useTranslations("Workspace.continueCompletion");
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  const { listing, ownerStatusKey, photoCount, rentalType } = ctx;
  const row = buildOwnerListingRowModel(listing, ctx.effectiveStatus);
  const ui = resolveOwnerListingUiStatus(row, locale);
  const statusLabel = tUi(ui.labelKey);
  const helperText = ui.helperValues
    ? tUi(ui.helperKey, ui.helperValues)
    : tUi(ui.helperKey);
  const analytics = buildListingAnalytics(
    listing,
    ctx.effectiveStatus,
    ownerStatusKey
  );
  const lifecycle = activeUntilLabel(ctx, t, dateLocale);
  const action = nextAction(ctx, t, row);
  const publicId = getListingPublicId(listing);
  const needsContinue = listingNeedsContinueCompletion(row);

  const showCompleteness =
    listingNeedsCompletenessPanel(ownerStatusKey) || needsContinue;
  const hasPerformance = hasListingPerformanceData(analytics);
  const price = getFormattedListingPrice(listing, tCommon);
  const isShortTerm = rentalType === "short_term";
  const showTrustRecommendation = externalLinkCount === 0;
  const continueHref = ownerListingContinueWizardHref(listing.id);

  const calendarPricingHref = `/dashboard/listings/${listing.id}/availability`;
  const pricingHref = isShortTerm
    ? calendarPricingHref
    : `/dashboard/listings/${listing.id}/pricing`;

  const healthItems = [
    {
      id: "photos",
      label: t("healthPhotos"),
      done: photoCount > 0,
      href: `/dashboard/listings/${listing.id}/photos`,
    },
    {
      id: "basics",
      label: t("healthBasics"),
      done: Boolean(listing.title?.trim() && listing.description?.trim()),
      href: `/dashboard/listings/${listing.id}/edit`,
    },
    {
      id: "price",
      label: t("healthPrice"),
      done: Boolean(
        isShortTerm
          ? listing.price_per_night && listing.price_per_night > 0
          : listing.price_monthly && listing.price_monthly > 0
      ),
      href: pricingHref,
    },
    {
      id: "availability",
      label: t("healthAvailability"),
      done: isShortTerm
        ? true
        : Boolean(listing.available_from || listing.availability_status),
      href: calendarPricingHref,
    },
  ];

  return (
    <div className="space-y-4">
      <ListingContinueCompletionCard row={row} amenityCount={0} />

      <div className="grid gap-3 lg:grid-cols-2">
        <WorkspaceSectionCard
          eyebrow={t("listingStatus")}
          title={statusLabel}
          description={helperText}
        >
          {lifecycle ? (
            <p className={cn("text-sm font-medium", lifecycle.tone)}>
              {lifecycle.text}
            </p>
          ) : null}
          {needsContinue ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold tabular-nums text-charcoal">
                {t("completionScore", { percent: row.completenessPercent })}
              </span>
              {row.missingRequiredCount > 0 ? (
                <span className="text-muted">
                  {t("missingItems", { count: row.missingRequiredCount })}
                </span>
              ) : null}
            </div>
          ) : null}
          {action ? (
            <Link
              href={action.href}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-dark hover:text-charcoal"
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          eyebrow={t("performance")}
          title={hasPerformance ? undefined : t("noStatsTitle")}
          description={hasPerformance ? undefined : t("noStatsBody")}
        >
          {hasPerformance ? (
            <div className="flex flex-wrap gap-5">
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
                  {recentLeads.length > 0 ? recentLeads.length : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted">
              <BarChart3 className="h-4 w-4 opacity-50" />
              <span className="text-sm">—</span>
            </div>
          )}
        </WorkspaceSectionCard>
      </div>

      <WorkspaceSectionCard title={t("quickActions")}>
        <div className="flex flex-wrap gap-2">
          {needsContinue ? (
            <Button href={continueHref} size="sm">
              {ownerStatusKey === "needs_fixes"
                ? tContinue("fixCta")
                : tContinue("continueCta")}
            </Button>
          ) : null}
          <Button href={`/dashboard/listings/${listing.id}/view`} size="sm" variant="outline">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("preview")}
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/photos`} size="sm" variant="outline">
            <Camera className="h-3.5 w-3.5" />
            {t("managePhotos")}
          </Button>
          <Button
            href={calendarPricingHref}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {isShortTerm ? t("manageCalendarPricing") : t("manageAvailability")}
          </Button>
          {!isShortTerm ? (
            <Button
              href={pricingHref}
              size="sm"
              variant="outline"
            >
              <Banknote className="h-3.5 w-3.5" />
              {t("managePricing")}
            </Button>
          ) : null}
          <Button href={`/dashboard/listings/${listing.id}/inquiries`} size="sm" variant="outline">
            <MessageSquare className="h-3.5 w-3.5" />
            {t("viewRequests")}
          </Button>
          <Button href={`/dashboard/listings/${listing.id}/edit`} size="sm" variant="outline">
            <Pencil className="h-3.5 w-3.5" />
            {t("edit")}
          </Button>
          {(ownerStatusKey === "published" || ownerStatusKey === "paused") && (
            <Button href={`/listings/${publicId}`} size="sm" variant="outline">
              {t("publicPage")}
            </Button>
          )}
        </div>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title={t("healthTitle")}
        description={t("healthBody")}
        action={
          <Link
            href={`/dashboard/listings/${listing.id}/publish`}
            className="text-xs font-medium text-gold-dark hover:text-charcoal"
          >
            {t("healthPublish")}
          </Link>
        }
      >
        <ul className="divide-y divide-border/70">
          {healthItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:text-charcoal"
              >
                <span className="inline-flex items-center gap-2 text-charcoal">
                  {item.done ? (
                    <CircleCheck className="h-4 w-4 text-teal" strokeWidth={1.75} />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                  )}
                  {item.label}
                </span>
                <span className="text-xs text-muted">
                  {item.done ? t("healthDone") : t("healthMissing")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        eyebrow={t("availability")}
        action={
          <Button
            href={calendarPricingHref}
            size="sm"
            variant="outline"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {isShortTerm ? t("manageCalendarPricing") : t("availability")}
          </Button>
        }
      >
        {isShortTerm ? (
          <>
            <p className="text-sm text-charcoal">
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
            <p className="text-sm font-semibold text-charcoal">
              {price.amount && price.amount > 0 ? price.display : "—"}
            </p>
            {listing.available_from ? (
              <p className="mt-0.5 text-xs text-muted">
                {t("availableFrom", {
                  date:
                    formatOwnerListingDate(listing.available_from, dateLocale) ??
                    "",
                })}
              </p>
            ) : null}
          </>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title={t("recentRequests")}
        action={
          recentLeads.length > 0 ? (
            <Link
              href={`/dashboard/listings/${listing.id}/inquiries`}
              className="text-xs font-medium text-gold-dark hover:text-charcoal"
            >
              {t("all")}
            </Link>
          ) : null
        }
      >
        {recentLeads.length === 0 ? (
          <DashboardEmptyState
            compact
            icon={MessageSquare}
            title={t("noRequestsTitle")}
            text={t("noRequestsBody")}
            className="border-0 bg-transparent px-0 py-1"
          />
        ) : (
          <div className="space-y-2">
            {recentLeads.slice(0, 3).map((lead) => (
              <PropertyLeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </WorkspaceSectionCard>

      {showCompleteness ? (
        <div id="listing-completeness" className="scroll-mt-24 space-y-3">
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

      {showTrustRecommendation ? (
        <WorkspaceSectionCard
          eyebrow={t("recommendation")}
          title={t("trustTitle")}
          description={t("trustBody")}
          action={
            <Button href={`/dashboard/listings/${listing.id}/trust-links`} size="sm">
              <Link2 className="h-3.5 w-3.5" />
              {t("add")}
            </Button>
          }
          tone="muted"
        />
      ) : null}
    </div>
  );
}
