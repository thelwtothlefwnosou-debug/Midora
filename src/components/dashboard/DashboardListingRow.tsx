"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Inbox,
  MoreHorizontal,
  Check,
  Circle,
  CalendarDays,
  Link2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ListingViewButton } from "@/components/dashboard/ListingViewButton";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { DashboardListingCover } from "@/components/dashboard/DashboardListingCover";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import { DashboardListingAnalyticsDrawer } from "@/components/dashboard/DashboardListingAnalyticsDrawer";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { listingNeedsCompletenessPanel } from "@/lib/owner-listings-page";
import {
  ownerListingPrimaryAction,
  resolveOwnerListingUiStatus,
} from "@/lib/owner-listing-ui-status";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import { ownerListingCompletenessItems } from "@/lib/owner-dashboard";
import {
  getFormattedListingPrice,
  getRentalTypeBadgeLabel,
  listingRentalType,
} from "@/lib/rental-types";
import { formatListingAvailabilityText } from "@/lib/listing-availability-status";
import { formatOwnerPropertyMeta } from "@/lib/owner-listing-card-helpers";
import { listingManageHref } from "@/lib/listing-workspace-nav";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { getListingPublicId, cn } from "@/lib/utils";

type Props = {
  row: OwnerListingRowModel;
  isFree: boolean;
  onDeleted?: (listingId: string) => void;
};

type CompletenessItemId =
  | "photos"
  | "location"
  | "price"
  | "availability"
  | "verification"
  | "registry";

function lifecycleLabel(
  row: OwnerListingRowModel,
  locale: string,
  t: ReturnType<typeof useTranslations<"Owner.list">>,
  tUi: ReturnType<typeof useTranslations<"Owner.uiStatus">>
): {
  text: string;
  tone: "neutral" | "green" | "amber" | "warning" | "expired";
  cta?: { labelKey: "renew" | "reactivate"; href: string };
} {
  const { listing, ownerStatusKey, daysUntilExpiry } = row;
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  const reactivateHref = `/dashboard/listings/${listing.id}/pay?reactivate=1`;

  if (ownerStatusKey === "published" || ownerStatusKey === "paused") {
    if (daysUntilExpiry == null) {
      return { text: t("activeNoExpiry"), tone: "neutral" };
    }
    if (daysUntilExpiry < 0) {
      const d = formatOwnerListingDate(listing.expires_at, dateLocale);
      return {
        text: d ? t("expiredAt", { date: d }) : t("expired"),
        tone: "expired",
        cta: { labelKey: "reactivate", href: reactivateHref },
      };
    }
    if (daysUntilExpiry <= 6) {
      return {
        text: t("expiresIn", { days: daysUntilExpiry }),
        tone: "warning",
        cta: { labelKey: "renew", href: reactivateHref },
      };
    }
    const d = formatOwnerListingDate(listing.expires_at, dateLocale);
    return {
      text: d ? t("activeUntil", { date: d }) : t("active"),
      tone: daysUntilExpiry <= 14 ? "amber" : "green",
      cta: daysUntilExpiry <= 14 ? { labelKey: "renew", href: reactivateHref } : undefined,
    };
  }

  if (ownerStatusKey === "expired") {
    const d = formatOwnerListingDate(listing.expires_at, dateLocale);
    return {
      text: d ? t("expiredAt", { date: d }) : t("expired"),
      tone: "expired",
      cta: { labelKey: "reactivate", href: reactivateHref },
    };
  }

  if (ownerStatusKey === "draft") {
    if (row.missingRequiredCount > 0) {
      return {
        text: tUi("helperMissingCount", { count: row.missingRequiredCount }),
        tone: "amber",
      };
    }
    if (row.completenessPercent >= 100) {
      return { text: tUi("ready"), tone: "green" };
    }
    return { text: tUi("helperNotSubmitted"), tone: "neutral" };
  }

  if (ownerStatusKey === "review") {
    return { text: tUi("helperSubmittedForReview"), tone: "neutral" };
  }

  if (ownerStatusKey === "needs_fixes") {
    return { text: tUi("needsFixes"), tone: "warning" };
  }

  return { text: "—", tone: "neutral" };
}

export function DashboardListingRow({ row, isFree, onDeleted }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Owner.list");
  const tUi = useTranslations("Owner.uiStatus");
  const tCta = useTranslations("Owner.cta");
  const tCompleteness = useTranslations("Owner.completeness");
  const tListing = useTranslations("Listing");
  const tCommon = useTranslations("Common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { listing, effectiveStatus, ownerStatusKey, photoCount, completenessPercent } = row;
  const ui = resolveOwnerListingUiStatus(row, locale);
  const analytics = buildListingAnalytics(
    listing,
    effectiveStatus,
    ownerStatusKey,
    row.leadStats
  );
  const primaryCta = ownerListingPrimaryAction(row);
  const completenessItems = ownerListingCompletenessItems(listing, photoCount);
  const showCompleteness = listingNeedsCompletenessPanel(ownerStatusKey);
  const lifecycle = lifecycleLabel(row, locale, t, tUi);
  const statusLabel = tUi(ui.labelKey);
  const helperText = ui.helperValues
    ? tUi(ui.helperKey, ui.helperValues)
    : tUi(ui.helperKey);

  const cover = pickListingCoverPhotoUrl(listing);
  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const price = getFormattedListingPrice(listing, tCommon);
  const propertyMeta = formatOwnerPropertyMeta(row, t);
  const publicId = getListingPublicId(listing);
  const manageHref = listingManageHref(listing.id);
  const editHref = `/dashboard/listings/${listing.id}/edit`;
  const availabilityHref = `${editHref}#availability-calendar`;
  const previewHref = `/listings/${publicId}`;
  const reactivateHref = isFree
    ? `/dashboard/listings/${listing.id}/pay?reactivate=1`
    : `/dashboard/listings/${listing.id}/pay`;

  async function copyPublicLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${previewHref}`
        : previewHref;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  }

  const showPerformance =
    ownerStatusKey === "published" || ownerStatusKey === "paused";

  function openListing(target: EventTarget | null) {
    if (
      target instanceof Element &&
      target.closest('a, button, input, textarea, select, [role="button"]')
    ) {
      return;
    }
    router.push(manageHref);
  }

  return (
    <>
      <article
        role="link"
        tabIndex={0}
        onClick={(e) => openListing(e.target)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(manageHref);
          }
        }}
        className="group cursor-pointer overflow-hidden rounded-[22px] border border-border bg-white shadow-soft transition-shadow hover:border-gold/25 hover:shadow-card"
      >
        <div className="flex min-h-[190px] flex-col gap-5 p-5 sm:p-6 xl:grid xl:grid-cols-[minmax(0,1.85fr)_minmax(140px,0.5fr)_minmax(130px,0.45fr)_minmax(150px,0.55fr)_minmax(200px,0.7fr)] xl:items-stretch xl:gap-6">
          {/* Photo + listing summary */}
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-[200px] w-full shrink-0 overflow-hidden rounded-2xl sm:h-[140px] sm:w-[200px] xl:h-[160px] xl:w-[240px]">
              <DashboardListingCover src={cover} roundedClassName="rounded-2xl" />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-charcoal/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                {getRentalTypeBadgeLabel(rentalType, tListing)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2">
                    <DashboardListingStatusBadge
                      statusKey={ui.styleKey}
                      label={statusLabel}
                      compact
                    />
                  </div>
                  <h3
                    className="line-clamp-2 text-lg font-semibold leading-snug text-charcoal sm:text-[19px] group-hover:text-gold-dark"
                    title={listing.title}
                  >
                    {listing.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-snug text-muted">
                    {listing.area_display_name || listing.area},{" "}
                    {listing.city_display_name || listing.city}
                  </p>
                  <p className="mt-3 font-display text-[21px] font-semibold leading-none text-charcoal">
                    {price.amount && price.amount > 0 ? price.display : "—"}
                  </p>
                  {propertyMeta ? (
                    <p className="mt-2 text-sm text-muted">{propertyMeta}</p>
                  ) : null}
                  <p className="mt-2 truncate text-xs text-muted/80" title={publicId}>
                    ID: {publicId}
                  </p>
                </div>
                <div className="relative shrink-0 xl:hidden">
                  <OverflowMenu
                    open={menuOpen}
                    onToggle={() => setMenuOpen((v) => !v)}
                    onClose={() => setMenuOpen(false)}
                    editHref={editHref}
                    previewHref={previewHref}
                    canViewPublic={ownerStatusKey === "published" || ownerStatusKey === "paused"}
                    reactivateHref={reactivateHref}
                    showReactivate={ownerStatusKey === "expired"}
                    listingId={listing.id}
                    onCopy={copyPublicLink}
                    copied={copied}
                    onDeleted={onDeleted}
                    t={t}
                    tCta={tCta}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  href={isShortTerm ? availabilityHref : editHref}
                  className="inline-flex items-center gap-1.5 font-medium text-gold-dark hover:underline"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isShortTerm ? t("manageCalendar") : t("editAvailability")}
                </Link>
                {!isShortTerm && (
                  <span className="text-muted">
                    {formatListingAvailabilityText(listing, (key, values) =>
                      tListing(key, values)
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-border pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted uppercase xl:hidden">
              {t("status")}
            </p>
            <DashboardListingStatusBadge
              statusKey={ui.styleKey}
              label={statusLabel}
              helperText={helperText}
            />
          </div>

          {/* Performance */}
          <div className="border-t border-border pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted uppercase xl:hidden">
              {t("performance")}
            </p>
            {showPerformance ? (
              hasListingPerformanceData(analytics) ? (
                <div className="space-y-2">
                  <MetricLine
                    icon={Eye}
                    value={formatAnalyticsMetric(analytics.viewsTotal)}
                    label={t("viewsTotalLabel")}
                  />
                  <MetricLine
                    icon={Inbox}
                    value={String(analytics.inquiriesLast30Days || analytics.inquiriesTotal)}
                    label={
                      analytics.inquiriesLast30Days > 0
                        ? t("requestsLast30")
                        : t("requestsTotal")
                    }
                    href={analytics.inquiriesTotal > 0 ? "/dashboard/requests" : undefined}
                  />
                  {analytics.unreadInquiries > 0 && (
                    <p className="text-[11px] font-medium text-gold-dark">
                      {t("newCount", { count: analytics.unreadInquiries })}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setAnalyticsOpen(true)}
                    className="text-[11px] font-medium text-charcoal/70 hover:text-gold-dark hover:underline"
                  >
                    {t("viewStats")}
                  </button>
                </div>
              ) : (
                <p className="text-xs leading-snug text-muted">{t("notEnoughData")}</p>
              )
            ) : (
              <p className="text-xs text-muted">—</p>
            )}
          </div>

          {/* Lifecycle */}
          <div className="border-t border-border pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted uppercase xl:hidden">
              {t("duration")}
            </p>
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                lifecycle.tone === "green" && "text-teal",
                lifecycle.tone === "amber" && "text-gold-dark",
                lifecycle.tone === "warning" && "text-orange-700",
                lifecycle.tone === "expired" && "text-charcoal/70",
                lifecycle.tone === "neutral" && "text-charcoal/80"
              )}
            >
              {lifecycle.text}
            </p>
            {lifecycle.cta ? (
              <Link
                href={lifecycle.cta.href}
                className="mt-2 inline-block text-xs font-semibold text-gold-dark hover:underline"
              >
                {t(lifecycle.cta.labelKey)}
              </Link>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
            <div className="hidden self-end xl:block">
              <OverflowMenu
                open={menuOpen}
                onToggle={() => setMenuOpen((v) => !v)}
                onClose={() => setMenuOpen(false)}
                editHref={editHref}
                previewHref={previewHref}
                canViewPublic={ownerStatusKey === "published" || ownerStatusKey === "paused"}
                reactivateHref={reactivateHref}
                showReactivate={ownerStatusKey === "expired"}
                listingId={listing.id}
                onCopy={copyPublicLink}
                copied={copied}
                onDeleted={onDeleted}
                t={t}
                tCta={tCta}
              />
            </div>
            <div className="space-y-2">
              <Button href={primaryCta.href} size="sm" className="w-full justify-center">
                {tCta(primaryCta.labelKey)}
              </Button>
              {ownerStatusKey === "published" || ownerStatusKey === "paused" ? (
                <ListingViewButton listingId={listing.id} className="w-full" />
              ) : null}
              {primaryCta.secondary ? (
                <Link
                  href={primaryCta.secondary.href}
                  className="block text-center text-xs font-medium text-charcoal/65 hover:text-gold-dark"
                >
                  {tCta(primaryCta.secondary.labelKey)}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {showCompleteness && (
          <div className="border-t border-amber-200/50 bg-amber-50/30 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-charcoal">
                  {ownerStatusKey === "draft" && completenessPercent >= 100
                    ? tUi("ready")
                    : row.missingRequiredCount > 0
                      ? `${tUi("helperMissingCount", { count: row.missingRequiredCount })} · ${completenessPercent}%`
                      : t("listingCompletenessPercent", { percent: completenessPercent })}
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {completenessItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-1.5 text-xs">
                      {item.done ? (
                        <Check className="h-3.5 w-3.5 text-teal" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-amber-500/70" />
                      )}
                      <span className={item.done ? "text-charcoal" : "text-muted"}>
                        {tCompleteness(item.id as CompletenessItemId)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button href={primaryCta.href} size="sm" variant="outline">
                {tCta(primaryCta.labelKey)}
              </Button>
            </div>
          </div>
        )}
      </article>

      <DashboardListingAnalyticsDrawer
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        title={listing.title}
        analytics={analytics}
      />
    </>
  );
}

function MetricLine({
  icon: Icon,
  value,
  label,
  href,
}: {
  icon: typeof Eye;
  value: string;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="font-display text-lg font-semibold tabular-nums text-charcoal">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </>
  );

  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
      {href ? (
        <Link href={href} className="hover:text-gold-dark">
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
    </div>
  );
}

function OverflowMenu({
  open,
  onToggle,
  onClose,
  editHref,
  previewHref,
  canViewPublic,
  reactivateHref,
  showReactivate,
  listingId,
  onCopy,
  copied,
  onDeleted,
  t,
  tCta,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  editHref: string;
  previewHref: string;
  canViewPublic: boolean;
  reactivateHref: string;
  showReactivate: boolean;
  listingId: string;
  onCopy: () => void;
  copied: boolean;
  onDeleted?: (listingId: string) => void;
  t: ReturnType<typeof useTranslations<"Owner.list">>;
  tCta: ReturnType<typeof useTranslations<"Owner.cta">>;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/60 hover:bg-sand"
        aria-label={t("actions")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label={t("close")}
            onClick={onClose}
          />
          <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-xl border border-border bg-white p-1.5 shadow-card">
            <MenuLink href={editHref} onClick={onClose}>
              {tCta("edit")}
            </MenuLink>
            <MenuLink href={`/dashboard/listings/${listingId}/view`} onClick={onClose}>
              {tCta("preview")}
            </MenuLink>
            {canViewPublic && (
              <MenuLink href={previewHref} onClick={onClose}>
                {t("publicPage")}
              </MenuLink>
            )}
            {canViewPublic && (
              <button
                type="button"
                onClick={onCopy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-charcoal hover:bg-sand"
              >
                <Link2 className="h-3.5 w-3.5 text-muted" />
                {copied ? t("copied") : t("copyLink")}
              </button>
            )}
            {showReactivate && (
              <MenuLink href={reactivateHref} onClick={onClose}>
                {t("reactivate")}
              </MenuLink>
            )}
            <div className="my-1 border-t border-border" />
            <div className="px-3 py-1">
              <DeleteListingButton listingId={listingId} onDeleted={onDeleted} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm text-charcoal hover:bg-sand"
    >
      {children}
    </Link>
  );
}
