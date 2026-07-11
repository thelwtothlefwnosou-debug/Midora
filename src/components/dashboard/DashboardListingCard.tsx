"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import type { ListingDisplayStatus } from "@/lib/listing-status";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import {
  formatMinStayLabel,
  formatListingPrice,
  listingRentalType,
  rentalTypeBadgeLabel,
} from "@/lib/rental-types";
import { formatListingAvailabilityText } from "@/lib/listing-availability-status";
import { formatViewCount, getDisplayViewCount } from "@/lib/listing-views";
import {
  listingPrimaryCta,
  ownerListingCompletenessItems,
  ownerListingCompletenessPercent,
} from "@/lib/owner-dashboard";

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
};

function formatCardDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatModePrice(listing: ListingWithImages): string {
  const price = formatListingPrice(listing);
  if (!price.amount || price.amount <= 0) return "—";
  return price.display;
}

function listingDateLabel(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  ownerKey: string
): string | null {
  if (ownerKey === "published" && listing.published_at) {
    const d = formatCardDate(listing.published_at);
    return d ? `Δημοσιεύτηκε ${d}` : null;
  }
  if (effectiveStatus === "expired" && listing.expires_at) {
    const d = formatCardDate(listing.expires_at);
    return d ? `Έληξε ${d}` : null;
  }
  if (ownerKey === "review") {
    const d = formatCardDate(listing.updated_at);
    return d ? `Υποβλήθηκε ${d}` : null;
  }
  const d = formatCardDate(listing.updated_at ?? listing.created_at);
  return d ? `Ενημερώθηκε ${d}` : null;
}

export function DashboardListingCard({
  listing,
  effectiveStatus,
  isFree,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const StatusIcon = statusIcons[ownerStatus.key] ?? AlertCircle;
  const images = listing.listing_images ?? [];
  const cover = images.find((i) => i.media_type !== "video")?.url;
  const photoCount = images.filter((i) => i.media_type !== "video").length;
  const canViewPublic = effectiveStatus === "approved";
  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const primaryCta = listingPrimaryCta(listing, effectiveStatus);
  const completenessItems = ownerListingCompletenessItems(listing, photoCount);
  const completenessPercent = ownerListingCompletenessPercent(listing, photoCount);
  const displayViews = getDisplayViewCount(listing);
  const dateLabel = listingDateLabel(listing, effectiveStatus, ownerStatus.key);
  const minStay = formatMinStayLabel(listing);
  const availabilityText = formatListingAvailabilityText(listing);

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
    ? { label: "Ημερολόγιο διαθεσιμότητας", href: availabilityHref }
    : { label: "Διαχείριση μηνιαίας διαθεσιμότητας", href: editHref };

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
                <span className="text-xs text-muted">Χωρίς φωτογραφία</span>
              </div>
            )}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <span className="rounded-md bg-charcoal/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                {rentalTypeBadgeLabel(rentalType)}
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
                {formatModePrice(listing)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {isShortTerm
                  ? minStay
                    ? `Ελάχιστη διαμονή: ${minStay}`
                    : "Ημερολόγιο διαθεσιμότητας"
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
                aria-label="Ενέργειες"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Κλείσιμο μενού"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-xl border border-border bg-white p-1.5 shadow-card">
                    <MenuLink href={editHref} onClick={() => setMenuOpen(false)}>
                      Επεξεργασία
                    </MenuLink>
                    <MenuLink href={availabilityHref} onClick={() => setMenuOpen(false)}>
                      Διαθεσιμότητα
                    </MenuLink>
                    <MenuLink href={pricingHref} onClick={() => setMenuOpen(false)}>
                      Τιμές
                    </MenuLink>
                    {(effectiveStatus === "pending" || effectiveStatus === "approved") && (
                      <MenuLink href={photosHref} onClick={() => setMenuOpen(false)}>
                        Φωτογραφίες
                      </MenuLink>
                    )}
                    {canViewPublic && (
                      <MenuLink href={previewHref} onClick={() => setMenuOpen(false)}>
                        Προεπισκόπηση
                      </MenuLink>
                    )}
                    {canViewPublic && (
                      <button
                        type="button"
                        onClick={copyPublicLink}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-charcoal hover:bg-sand"
                      >
                        <Link2 className="h-3.5 w-3.5 text-muted" />
                        {copied ? "Αντιγράφηκε!" : "Αντιγραφή link"}
                      </button>
                    )}
                    {effectiveStatus === "expired" && (
                      <MenuLink href={reactivateHref} onClick={() => setMenuOpen(false)}>
                        Ανανέωση
                      </MenuLink>
                    )}
                    <div className="my-1 border-t border-border" />
                    <div className="px-3 py-1">
                      <DeleteListingButton listingId={listing.id} />
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
              {ownerStatus.label}
            </span>
            {dateLabel && <span>{dateLabel}</span>}
            {effectiveStatus === "approved" && (
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {formatViewCount(displayViews)}{" "}
                {displayViews === 1 ? "επίσκεψη" : "επισκέψεις"}
              </span>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button href={primaryCta.href} size="sm">
              {primaryCta.label}
            </Button>
            {canViewPublic && (
              <Link
                href={previewHref}
                className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-gold"
              >
                <Eye className="h-3 w-3" />
                Προεπισκόπηση
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT — completeness */}
        <div className="border-t border-border p-4 lg:w-[220px] lg:shrink-0 lg:border-t-0 lg:border-l lg:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-charcoal">Πληρότητα</p>
            <span className="text-sm font-semibold text-gold">{completenessPercent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Η αγγελία είναι {completenessPercent}% έτοιμη
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
                  {item.label}
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
