"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  Inbox,
  MoreHorizontal,
  Check,
  Circle,
  CalendarDays,
  Link2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ListingViewButton } from "@/components/dashboard/ListingViewButton";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import { DashboardListingAnalyticsDrawer } from "@/components/dashboard/DashboardListingAnalyticsDrawer";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { listingNeedsCompletenessPanel } from "@/lib/owner-listings-page";
import {
  getOwnerListingStatus,
  ownerListingStatusHelper,
  formatOwnerListingDate,
} from "@/lib/dashboard-listings";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";
import { listingPrimaryCta, ownerListingCompletenessItems } from "@/lib/owner-dashboard";
import {
  formatListingPrice,
  listingRentalType,
  rentalTypeBadgeLabel,
} from "@/lib/rental-types";
import { formatListingAvailabilityText } from "@/lib/listing-availability-status";
import { listingManageHref } from "@/lib/listing-workspace-nav";
import { getListingPublicId, cn } from "@/lib/utils";

type Props = {
  row: OwnerListingRowModel;
  isFree: boolean;
};

function formatPropertyMeta(row: OwnerListingRowModel): string {
  const { listing } = row;
  const parts: string[] = [];
  const guests = listing.max_guests ?? listing.included_guests;
  if (guests) parts.push(`${guests} επισκέπτες`);
  if (listing.bedrooms) parts.push(`${listing.bedrooms} υπν.`);
  if (listing.bathrooms) parts.push(`${listing.bathrooms} μπάνιο`);
  if (listing.sqm) parts.push(`${listing.sqm} τ.μ.`);
  return parts.join(" · ");
}

function lifecycleLabel(row: OwnerListingRowModel): {
  text: string;
  tone: "neutral" | "green" | "amber" | "warning" | "expired";
  cta?: { label: string; href: string };
} {
  const { listing, ownerStatusKey, daysUntilExpiry } = row;
  const reactivateHref = `/dashboard/listings/${listing.id}/pay?reactivate=1`;

  if (ownerStatusKey === "published" || ownerStatusKey === "paused") {
    if (daysUntilExpiry == null) {
      return { text: "Ενεργή χωρίς ημερομηνία λήξης", tone: "neutral" };
    }
    if (daysUntilExpiry < 0) {
      const d = formatOwnerListingDate(listing.expires_at);
      return {
        text: d ? `Έληξε στις ${d}` : "Έληξε",
        tone: "expired",
        cta: { label: "Επανενεργοποίηση", href: reactivateHref },
      };
    }
    if (daysUntilExpiry <= 6) {
      return {
        text: `Λήγει σε ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "ημέρα" : "ημέρες"}`,
        tone: "warning",
        cta: { label: "Ανανέωση", href: reactivateHref },
      };
    }
    if (daysUntilExpiry <= 14) {
      const d = formatOwnerListingDate(listing.expires_at);
      return {
        text: d ? `Ενεργή έως ${d.replace(/^(\d+) /, "$1 ")}` : `Λήγει σε ${daysUntilExpiry} ημέρες`,
        tone: "amber",
        cta: { label: "Ανανέωση", href: reactivateHref },
      };
    }
    const d = formatOwnerListingDate(listing.expires_at);
    return {
      text: d ? `Ενεργή έως ${d}` : "Ενεργή",
      tone: "green",
    };
  }

  if (ownerStatusKey === "expired") {
    const d = formatOwnerListingDate(listing.expires_at);
    return {
      text: d ? `Έληξε στις ${d}` : "Έληξε",
      tone: "expired",
      cta: { label: "Επανενεργοποίηση", href: reactivateHref },
    };
  }

  if (ownerStatusKey === "draft") {
    return { text: "Δεν έχει δημοσιευτεί ακόμα", tone: "neutral" };
  }

  if (ownerStatusKey === "review" || ownerStatusKey === "needs_fixes") {
    return { text: "Αναμονή ελέγχου", tone: "neutral" };
  }

  return { text: "—", tone: "neutral" };
}

export function DashboardListingRow({ row, isFree }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { listing, effectiveStatus, ownerStatusKey, photoCount, completenessPercent } = row;
  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const helperText = ownerListingStatusHelper(listing, effectiveStatus, ownerStatusKey);
  const analytics = buildListingAnalytics(
    listing,
    effectiveStatus,
    ownerStatusKey,
    row.leadStats
  );
  const primaryCta = listingPrimaryCta(listing, effectiveStatus);
  const completenessItems = ownerListingCompletenessItems(listing, photoCount);
  const showCompleteness = listingNeedsCompletenessPanel(ownerStatusKey);
  const lifecycle = lifecycleLabel(row);

  const images = listing.listing_images ?? [];
  const cover = images.find((i) => i.media_type !== "video")?.url;
  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const price = formatListingPrice(listing);
  const propertyMeta = formatPropertyMeta(row);
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
        className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-shadow hover:border-gold/25 hover:shadow-card"
      >
        <div className="flex flex-col xl:grid xl:grid-cols-[160px_minmax(0,1.4fr)_140px_150px_150px_auto] xl:items-stretch">
          {/* Thumbnail */}
          <div className="relative shrink-0 p-3 pb-0 xl:p-4 xl:pb-4">
            <div className="relative h-[120px] w-full overflow-hidden rounded-[13px] bg-sand/40 sm:w-[160px]">
              {cover ? (
                <Image src={cover} alt="" fill className="object-cover" sizes="160px" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                  <ImageIcon className="h-6 w-6 opacity-50" />
                  <span className="text-[11px]">Χωρίς φωτογραφία</span>
                </div>
              )}
              <span className="absolute top-2 left-2 rounded-md bg-charcoal/90 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                {rentalTypeBadgeLabel(rentalType)}
              </span>
            </div>
          </div>

          {/* Identity */}
          <div className="min-w-0 space-y-2 border-border px-3 py-3 xl:border-r xl:px-4 xl:py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="line-clamp-2 font-semibold text-charcoal group-hover:text-gold-dark"
                  title={listing.title}
                >
                  {listing.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted">
                  {listing.area_display_name || listing.area}, {listing.city_display_name || listing.city}
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-charcoal">
                  {price.amount && price.amount > 0 ? price.display : "—"}
                </p>
                {propertyMeta ? (
                  <p className="mt-1 text-xs text-muted">{propertyMeta}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-muted/80">ID: {publicId}</p>
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
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <Link
                href={isShortTerm ? availabilityHref : editHref}
                className="inline-flex items-center gap-1 font-medium text-gold-dark hover:underline"
              >
                <CalendarDays className="h-3 w-3" />
                {isShortTerm ? "Διαχείριση ημερολογίου" : "Επεξεργασία διαθεσιμότητας"}
              </Link>
              {!isShortTerm && (
                <span className="text-muted">{formatListingAvailabilityText(listing)}</span>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-border px-3 py-3 xl:border-t-0 xl:border-r xl:px-4 xl:py-4">
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted uppercase xl:hidden">
              Κατάσταση
            </p>
            <DashboardListingStatusBadge
              statusKey={ownerStatusKey}
              label={ownerStatus.label}
              helperText={helperText}
            />
          </div>

          {/* Performance */}
          <div className="border-t border-border px-3 py-3 xl:border-t-0 xl:border-r xl:px-4 xl:py-4">
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted uppercase xl:hidden">
              Απόδοση
            </p>
            {showPerformance ? (
              hasListingPerformanceData(analytics) ? (
                <div className="space-y-2">
                  <MetricLine
                    icon={Eye}
                    value={formatAnalyticsMetric(analytics.viewsTotal)}
                    label="Προβολές · σύνολο"
                  />
                  <MetricLine
                    icon={Inbox}
                    value={String(analytics.inquiriesLast30Days || analytics.inquiriesTotal)}
                    label={
                      analytics.inquiriesLast30Days > 0
                        ? "Αιτήματα · 30 ημέρες"
                        : "Αιτήματα · σύνολο"
                    }
                    href={analytics.inquiriesTotal > 0 ? "/dashboard/requests" : undefined}
                  />
                  {analytics.unreadInquiries > 0 && (
                    <p className="text-[11px] font-medium text-gold-dark">
                      {analytics.unreadInquiries} νέα
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setAnalyticsOpen(true)}
                    className="text-[11px] font-medium text-charcoal/70 hover:text-gold-dark hover:underline"
                  >
                    Δες στατιστικά
                  </button>
                </div>
              ) : (
                <p className="text-xs leading-snug text-muted">
                  Δεν υπάρχουν ακόμη αρκετά δεδομένα προβολών.
                </p>
              )
            ) : (
              <p className="text-xs text-muted">—</p>
            )}
          </div>

          {/* Lifecycle */}
          <div className="border-t border-border px-3 py-3 xl:border-t-0 xl:border-r xl:px-4 xl:py-4">
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted uppercase xl:hidden">
              Διάρκεια
            </p>
            <p
              className={cn(
                "text-sm font-medium",
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
                {lifecycle.cta.label}
              </Link>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-between gap-3 border-t border-border p-3 xl:border-t-0 xl:p-4">
            <div className="hidden xl:block">
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
              />
            </div>
            <div className="space-y-2">
              <Button href={primaryCta.href} size="sm" className="w-full justify-center">
                {primaryCta.label}
              </Button>
              <ListingViewButton listingId={listing.id} className="w-full" />
              {primaryCta.secondary ? (
                <Link
                  href={primaryCta.secondary.href}
                  className="block text-center text-xs font-medium text-charcoal/65 hover:text-gold-dark"
                >
                  {primaryCta.secondary.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {showCompleteness && (
          <div className="border-t border-border bg-cream/20 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-charcoal">
                  Πληρότητα αγγελίας: {completenessPercent}%
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {completenessItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-1.5 text-xs">
                      {item.done ? (
                        <Check className="h-3.5 w-3.5 text-teal" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted/50" />
                      )}
                      <span className={item.done ? "text-charcoal" : "text-muted"}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button href={primaryCta.href} size="sm" variant="outline">
                Ολοκλήρωσε την αγγελία
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
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/60 hover:bg-sand"
        aria-label="Ενέργειες"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-10" aria-label="Κλείσιμο" onClick={onClose} />
          <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-xl border border-border bg-white p-1.5 shadow-card">
            <MenuLink href={editHref} onClick={onClose}>
              Επεξεργασία
            </MenuLink>
            <MenuLink href={`/dashboard/listings/${listingId}/view`} onClick={onClose}>
              Προβολή
            </MenuLink>
            {canViewPublic && (
              <MenuLink href={previewHref} onClick={onClose}>
                Δημόσια σελίδα
              </MenuLink>
            )}
            {canViewPublic && (
              <button
                type="button"
                onClick={onCopy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-charcoal hover:bg-sand"
              >
                <Link2 className="h-3.5 w-3.5 text-muted" />
                {copied ? "Αντιγράφηκε!" : "Αντιγραφή link"}
              </button>
            )}
            {showReactivate && (
              <MenuLink href={reactivateHref} onClick={onClose}>
                Επανενεργοποίηση
              </MenuLink>
            )}
            <div className="my-1 border-t border-border" />
            <div className="px-3 py-1">
              <DeleteListingButton listingId={listingId} />
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
