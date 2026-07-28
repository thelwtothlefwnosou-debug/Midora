import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import {
  getOwnerListingStatus,
  isOwnerListingDraft,
  type OwnerListingStatusKey,
} from "@/lib/dashboard-listings";
import type { ListingLeadStats } from "@/lib/owner-listing-analytics";
import { listingRentalType } from "@/lib/rental-types";
import {
  ownerListingCompletenessItems,
  ownerListingCompletenessPercent,
} from "@/lib/owner-dashboard";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { getDisplayViewCount } from "@/lib/listing-views";

export type ListingFilterTab =
  | "all"
  | "action_required"
  | "draft"
  | "published"
  | "review"
  | "inactive";

export type ListingSortOption =
  | "recent"
  | "views"
  | "inquiries"
  | "expiring";

export type OwnerActionRequiredMessageKey =
  | "msgMissingRequired"
  | "msgNeedsFixes"
  | "msgExpired"
  | "msgExpiringSoon"
  | "msgExpiringDays"
  | "msgMissingPhotos";

export type OwnerActionRequiredCtaKey =
  | "ctaContinue"
  | "ctaFix"
  | "ctaRenew"
  | "ctaAdd";

export type OwnerActionRequiredItem = {
  id: string;
  listingId: string;
  title: string;
  messageKey: OwnerActionRequiredMessageKey;
  messageValues?: Record<string, string | number>;
  ctaKey: OwnerActionRequiredCtaKey;
  href: string;
  kind: "draft" | "needs_fixes" | "expired" | "photos" | "expiring";
};

export type OwnerListingAlert = {
  id: string;
  message: string;
  cta: string;
  href: string;
  tone: "amber" | "gold" | "neutral";
};

export type OwnerListingsOverview = {
  activeCount: number;
  viewsLast30Days: number | null;
  newInquiries: number;
  needsActionCount: number;
};

export type OwnerListingRowModel = {
  listing: ListingWithImages;
  effectiveStatus: ListingDisplayStatus;
  ownerStatusKey: OwnerListingStatusKey;
  photoCount: number;
  completenessPercent: number;
  missingRequiredCount: number;
  leadStats: ListingLeadStats;
  daysUntilExpiry: number | null;
};

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function buildOwnerListingRowModel(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  leadStats: ListingLeadStats = { total: 0, last30Days: 0, unread: 0 }
): OwnerListingRowModel {
  const photoCount =
    listing.listing_images?.filter((i) => i.media_type !== "video").length ?? 0;
  const completenessItems = ownerListingCompletenessItems(listing, photoCount);
  const missingRequiredCount = completenessItems.filter((i) => !i.done).length;

  return {
    listing,
    effectiveStatus,
    ownerStatusKey: getOwnerListingStatus(listing, effectiveStatus).key,
    photoCount,
    completenessPercent: ownerListingCompletenessPercent(listing, photoCount),
    missingRequiredCount,
    leadStats,
    daysUntilExpiry: daysUntil(listing.expires_at),
  };
}

export function isOwnerListingActionRequired(row: OwnerListingRowModel): boolean {
  const { ownerStatusKey, completenessPercent, photoCount, daysUntilExpiry } = row;

  if (ownerStatusKey === "draft" && completenessPercent < 100) return true;
  if (ownerStatusKey === "needs_fixes") return true;
  if (ownerStatusKey === "expired") return true;
  if (
    daysUntilExpiry != null &&
    daysUntilExpiry >= 0 &&
    daysUntilExpiry <= 14 &&
    (ownerStatusKey === "published" || ownerStatusKey === "paused")
  ) {
    return true;
  }
  if (
    ownerStatusKey === "review" &&
    photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW
  ) {
    return true;
  }
  return false;
}

export function filterOwnerListings(
  rows: OwnerListingRowModel[],
  tab: ListingFilterTab
): OwnerListingRowModel[] {
  if (tab === "all") return rows;
  return rows.filter((row) => {
    switch (tab) {
      case "action_required":
        return isOwnerListingActionRequired(row);
      case "published":
        return row.ownerStatusKey === "published";
      case "review":
        return row.ownerStatusKey === "review";
      case "draft":
        return row.ownerStatusKey === "draft";
      case "inactive":
        return (
          row.ownerStatusKey === "paused" ||
          row.ownerStatusKey === "expired" ||
          row.ownerStatusKey === "rejected"
        );
      default:
        return true;
    }
  });
}

export function searchOwnerListings(
  rows: OwnerListingRowModel[],
  query: string
): OwnerListingRowModel[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const { listing } = row;
    const haystack = [listing.title, listing.city, listing.area, listing.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterByRentalType(
  rows: OwnerListingRowModel[],
  rentalFilter: "all" | "short_term" | "monthly"
): OwnerListingRowModel[] {
  if (rentalFilter === "all") return rows;
  return rows.filter((row) => listingRentalType(row.listing) === rentalFilter);
}

export function sortOwnerListings(
  rows: OwnerListingRowModel[],
  sort: ListingSortOption
): OwnerListingRowModel[] {
  const copy = [...rows];
  switch (sort) {
    case "views":
      return copy.sort(
        (a, b) => getDisplayViewCount(b.listing) - getDisplayViewCount(a.listing)
      );
    case "inquiries":
      return copy.sort((a, b) => b.leadStats.total - a.leadStats.total);
    case "expiring":
      return copy.sort((a, b) => {
        const da = a.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
        const db = b.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
    case "recent":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.listing.updated_at ?? b.listing.created_at).getTime() -
          new Date(a.listing.updated_at ?? a.listing.created_at).getTime()
      );
  }
}

export function countListingsByTab(
  rows: OwnerListingRowModel[]
): Record<ListingFilterTab, number> {
  return {
    all: rows.length,
    action_required: rows.filter((r) => isOwnerListingActionRequired(r)).length,
    published: rows.filter((r) => r.ownerStatusKey === "published").length,
    review: rows.filter((r) => r.ownerStatusKey === "review").length,
    draft: rows.filter((r) => r.ownerStatusKey === "draft").length,
    inactive: rows.filter(
      (r) =>
        r.ownerStatusKey === "paused" ||
        r.ownerStatusKey === "expired" ||
        r.ownerStatusKey === "rejected"
    ).length,
  };
}

export function buildOwnerListingsOverview(
  rows: OwnerListingRowModel[],
  newInquiries: number
): OwnerListingsOverview {
  const published = rows.filter((r) => r.ownerStatusKey === "published");
  const hasViewData = published.some((r) => getDisplayViewCount(r.listing) > 0);
  const viewsSum = published.reduce(
    (sum, r) => sum + getDisplayViewCount(r.listing),
    0
  );

  return {
    activeCount: published.length,
    viewsLast30Days: hasViewData ? viewsSum : null,
    newInquiries,
    needsActionCount: buildOwnerActionRequiredItems(rows).length,
  };
}

/** One organized action item per listing that needs owner attention. */
export function buildOwnerActionRequiredItems(
  rows: OwnerListingRowModel[]
): OwnerActionRequiredItem[] {
  const items: OwnerActionRequiredItem[] = [];

  for (const row of rows) {
    const {
      listing,
      ownerStatusKey,
      photoCount,
      completenessPercent,
      daysUntilExpiry,
    } = row;

    if (ownerStatusKey === "draft" && completenessPercent < 100) {
      items.push({
        id: `draft-${listing.id}`,
        listingId: listing.id,
        title: listing.title,
        messageKey: "msgMissingRequired",
        ctaKey: "ctaContinue",
        href: `/dashboard/listings/new?draft=${listing.id}`,
        kind: "draft",
      });
      continue;
    }

    if (ownerStatusKey === "needs_fixes") {
      items.push({
        id: `fixes-${listing.id}`,
        listingId: listing.id,
        title: listing.title,
        messageKey: "msgNeedsFixes",
        ctaKey: "ctaFix",
        href: `/dashboard/listings/${listing.id}/edit`,
        kind: "needs_fixes",
      });
      continue;
    }

    if (ownerStatusKey === "expired") {
      items.push({
        id: `expired-${listing.id}`,
        listingId: listing.id,
        title: listing.title,
        messageKey: "msgExpired",
        ctaKey: "ctaRenew",
        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,
        kind: "expired",
      });
      continue;
    }

    if (
      daysUntilExpiry != null &&
      daysUntilExpiry >= 0 &&
      daysUntilExpiry <= 14 &&
      (ownerStatusKey === "published" || ownerStatusKey === "paused")
    ) {
      items.push({
        id: `expiring-${listing.id}`,
        listingId: listing.id,
        title: listing.title,
        messageKey:
          daysUntilExpiry <= 1 ? "msgExpiringSoon" : "msgExpiringDays",
        messageValues:
          daysUntilExpiry <= 1 ? undefined : { days: daysUntilExpiry },
        ctaKey: "ctaRenew",
        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,
        kind: "expiring",
      });
      continue;
    }

    if (
      ownerStatusKey === "review" &&
      photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW
    ) {
      items.push({
        id: `photos-${listing.id}`,
        listingId: listing.id,
        title: listing.title,
        messageKey: "msgMissingPhotos",
        ctaKey: "ctaAdd",
        href: `/dashboard/listings/${listing.id}/photos`,
        kind: "photos",
      });
    }
  }

  return items;
}

/** @deprecated Prefer buildOwnerActionRequiredItems — kept for overview metrics compatibility. */
export function buildOwnerListingAlerts(
  rows: OwnerListingRowModel[],
  newInquiries: number
): OwnerListingAlert[] {
  const items: OwnerListingAlert[] = buildOwnerActionRequiredItems(rows).map((item) => ({
    id: item.id,
    message: item.messageKey,
    cta: item.ctaKey,
    href: item.href,
    tone:
      item.kind === "needs_fixes" || item.kind === "expired"
        ? ("amber" as const)
        : item.kind === "draft" || item.kind === "expiring"
          ? ("gold" as const)
          : ("neutral" as const),
  }));

  if (newInquiries > 0) {
    items.unshift({
      id: "new-inquiries",
      message:
        newInquiries === 1
          ? "Έχεις 1 νέο αίτημα ενδιαφέροντος"
          : `Έχεις ${newInquiries} νέα αιτήματα ενδιαφέροντος`,
      cta: "Δες τα αιτήματα",
      href: "/dashboard/requests",
      tone: "gold",
    });
  }

  return items;
}

export function listingNeedsCompletenessPanel(
  ownerStatusKey: OwnerListingStatusKey
): boolean {
  return ownerStatusKey === "draft" || ownerStatusKey === "needs_fixes";
}

export { isOwnerListingDraft };
