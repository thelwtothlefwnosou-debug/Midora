"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  BarChart3,
  MoreHorizontal,
  Check,
  Circle,
  Link2,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import type { ListingWithImages } from "@/lib/types";
import { getListingPublicId, cn } from "@/lib/utils";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import { getOwnerListingStatus, getOwnerListingUiLabelKey } from "@/lib/dashboard-listings";
import {
  formatMinStayLabel,
  getFormattedListingPrice,
  getRentalTypeBadgeLabel,
  listingRentalType,
} from "@/lib/rental-types";
import { formatListingAvailabilityText } from "@/lib/listing-availability-status";
import { formatViewCount, getDisplayViewCount } from "@/lib/listing-views";
import {
  ownerListingCompletenessItems,
  ownerListingCompletenessPercent,
} from "@/lib/owner-dashboard";
import {
  buildOwnerListingRowModel,
} from "@/lib/owner-listings-page";
import { ownerListingPrimaryAction } from "@/lib/owner-listing-ui-status";

const statusIcons: Partial<Record<import("@/lib/dashboard-listings").OwnerListingStatusKey, typeof Clock>> = {
  draft: Clock,
  review: Clock,
  needs_fixes: AlertCircle,
  published: CheckCircle,
  paused: Clock,
  expired: XCircle,
  rejected: XCircle,
};

type Props = {
  listing: ListingWithImages;
  effectiveStatus: ListingDisplayStatus;
  isFree: boolean;
  onDeleted?: (listingId: string) => void;
};

function formatCardDate(
  iso: string | null | undefined,
  locale: string
): string | null {
  if (!iso) return null;
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";
  return new Date(iso).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatModePrice(
  listing: ListingWithImages,
  tCommon: ReturnType<typeof useTranslations<"Common">>
): string {
  const price = getFormattedListingPrice(listing, tCommon);
  if (!price.amount || price.amount <= 0) return "—";
  return price.display;
}

type OwnerListDateT = (
  key: "publishedOn" | "expiredOn" | "submittedOn" | "updatedOn",
  values: { date: string }
) => string;

function listingDateLabel(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  ownerKey: string,
  locale: string,
  t: OwnerListDateT
): string | null {
  if (ownerKey === "published" && listing.published_at) {
    const d = formatCardDate(listing.published_at, locale);
    return d ? t("publishedOn", { date: d }) : null;
  }
  if (effectiveStatus === "expired" && listing.expires_at) {
    const d = formatCardDate(listing.expires_at, locale);
    return d ? t("expiredOn", { date: d }) : null;
  }
  if (ownerKey === "review") {
    const d = formatCardDate(listing.updated_at, locale);
    return d ? t("submittedOn", { date: d }) : null;
  }
  const d = formatCardDate(listing.updated_at ?? listing.created_at, locale);
  return d ? t("updatedOn", { date: d }) : null;
}

export function DashboardListingCard({
  listing,
  effectiveStatus,
  isFree,
  onDeleted,
}: Props) {
  const locale = useLocale();
  const tCta = useTranslations("Owner.cta");
  const tListing = useTranslations("Listing");
  const tCommon = useTranslations("Common");
  const tList = useTranslations("Owner.list");
  const tUi = useTranslations("Owner.uiStatus");
  const tCompleteness = useTranslations("Owner.completeness");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const StatusIcon = statusIcons[ownerStatus.key] ?? AlertCircle;
  const images = listing.listing_images ?? [];
  const cover = pickListingCoverPhotoUrl(listing);
  const photoCount = images.filter((i) => i.media_type !== "video").length;
  const canViewPublic = effectiveStatus === "approved";
  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const row = buildOwnerListingRowModel(listing, effectiveStatus);
  const primaryCta = ownerListingPrimaryAction(row);
  const completenessItems = ownerListingCompletenessItems(listing, photoCount);
  const completenessPercent = ownerListingCompletenessPercent(listing, photoCount);
  const displayViews = getDisplayViewCount(listing);
  const dateLabel = listingDateLabel(
    listing,
    effectiveStatus,
    ownerStatus.key,
    locale,
    tList
  );
  const minStay = formatMinStayLabel(listing);
  const availabilityText = formatListingAvailabilityText(listing, (key, values) =>
    tListing(key, values)
  );

  const editHref = `/dashboard/listings/${listing.id}/edit`;
  const availabilityHref = `${editHref}#availability-calendar`;
  const pricingHref = isShortTerm
    ? availabilityHref
    : `/dashboard/listings/${listing.id}/pricing`;
  const photosHref = `/dashboard/listings/${listing.id}/photos`;
  const previewHref = `/listings/${getListingPublicId(listing)}`;
  const reactivateHref = isFree
    ? `/dashboard/listings/${listing.id}/pay?reactivate=1`
    : `/dashboard/listings/${listing.id}/pay`;

  async function copyPublicLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/listings/${getListingPublicId(listing)}`
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

  const modeAction = isShortTerm
    ? { label: tList("availabilityCalendar"), href: availabilityHref }
    : { label: tList("manageMonthlyAvailability"), href: editHref };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
      <div className="flex flex-col lg:flex-row">
        {/* LEFT — cover */}
        <div className="relative w-full shrink-0 lg:w-[240px]">
          <div className="relative aspect-[3/2] w-full bg-sand/40 lg:h-[160px] lg:w-[240px] lg:aspect-auto">
            {cover ? (
              <Image
                src={cover}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="240px"
              />
            ) : (
              <div className="flex h-full min-h-[120px] w-full items-center justify-center">
                <span className="text-xs text-muted">{tList("noPhoto")}</span>
              </div>
            )}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <span className="rounded-md bg-charcoal/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                {getRentalTypeBadgeLabel(rentalType, tListing)}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER — details */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 border-border p-4 lg:border-l lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-charcoal">{listing.title}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {listing.area}, {listing.city}
              </p>

              <p className="mt-2 font-display text-lg font-semibold text-charcoal">
                {formatModePrice(listing, tCommon)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {isShortTerm
                  ? minStay
                    ? tList("minStay", { value: minStay })
                    : tList("availabilityCalendar")
                  : availabilityText}
              </p>
              <Link
                href={modeAction.href}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
              >
                <CalendarDays className="h-3 w-3" />
                {modeAction.label}
              </Link>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/60 hover:bg-sand hover:text-charcoal"
                aria-label={tList("actions")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label={tList("closeMenu")}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-xl border border-border bg-white p-1.5 shadow-card">
                    <MenuLink href={editHref} onClick={() => setMenuOpen(false)}>
                      {tList("edit")}
                    </MenuLink>
                    <MenuLink href={availabilityHref} onClick={() => setMenuOpen(false)}>
                      {tList("availability")}
                    </MenuLink>
                    <MenuLink href={pricingHref} onClick={() => setMenuOpen(false)}>
                      {tList("pricing")}
                    </MenuLink>
                    {(effectiveStatus === "pending" || effectiveStatus === "approved") && (
                      <MenuLink href={photosHref} onClick={() => setMenuOpen(false)}>
                        {tList("photos")}
                      </MenuLink>
                    )}
                    <MenuLink href={`/dashboard/listings/${listing.id}/view`} onClick={() => setMenuOpen(false)}>
                      {tList("view")}
                    </MenuLink>
                    {canViewPublic && (
                      <MenuLink href={previewHref} onClick={() => setMenuOpen(false)}>
                        {tList("publicPage")}
                      </MenuLink>
                    )}
                    {canViewPublic && (
                      <button
                        type="button"
                        onClick={copyPublicLink}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-charcoal hover:bg-sand"
                      >
                        <Link2 className="h-3.5 w-3.5 text-muted" />
                        {copied ? tList("copied") : tList("copyLink")}
                      </button>
                    )}
                    {effectiveStatus === "expired" && (
                      <MenuLink href={reactivateHref} onClick={() => setMenuOpen(false)}>
                        {tList("renew")}
                      </MenuLink>
                    )}
                    <div className="my-1 border-t border-border" />
                    <div className="px-3 py-1">
                      <DeleteListingButton listingId={listing.id} onDeleted={onDeleted} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
                ownerStatus.key === "published"
                  ? "border-teal/30 bg-teal/10 text-teal"
                  : ownerStatus.key === "review" || ownerStatus.key === "needs_fixes"
                    ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                    : "border-border bg-sand/50 text-charcoal/70"
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {tUi(getOwnerListingUiLabelKey(ownerStatus.key))}
            </span>
            {dateLabel && <span>{dateLabel}</span>}
            {effectiveStatus === "approved" && (
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {tList("viewsCount", {
                  formatted: formatViewCount(displayViews),
                  count: displayViews,
                })}
              </span>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button href={primaryCta.href} size="sm">
              {tCta(primaryCta.labelKey)}
            </Button>
            <Link
              href={`/dashboard/listings/${listing.id}/view`}
              className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-gold"
            >
              <Eye className="h-3 w-3" />
              {tList("view")}
            </Link>
            {canViewPublic && (
              <Link
                href={previewHref}
                className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-gold"
              >
                {tList("public")}
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT — completeness */}
        <div className="border-t border-border p-4 lg:w-[220px] lg:shrink-0 lg:border-t-0 lg:border-l lg:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-charcoal">{tList("completeness")}</p>
            <span className="text-sm font-semibold text-gold">{completenessPercent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {tList("completenessReady", { percent: completenessPercent })}
          </p>
          <ul className="mt-3 space-y-1.5">
            {completenessItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                {item.done ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-teal" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted/50" />
                )}
                <span className={item.done ? "text-charcoal" : "text-muted"}>
                  {tCompleteness(item.id as "photos" | "location" | "price" | "availability" | "verification" | "registry")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
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
