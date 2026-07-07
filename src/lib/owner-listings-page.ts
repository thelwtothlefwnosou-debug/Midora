import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import {
  getOwnerListingStatus,
  isOwnerListingDraft,
  type OwnerListingStatusKey,
} from "@/lib/dashboard-listings";
import type { ListingLeadStats } from "@/lib/owner-listing-analytics";
import { listingRentalType } from "@/lib/rental-types";
import { ownerListingCompletenessPercent } from "@/lib/owner-dashboard";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";

export type ListingFilterTab =
  | "all"
  | "published"
  | "review"
  | "draft"
  | "paused"
  | "expired";

export type ListingSortOption =
  | "recent"
  | "views"
  | "inquiries"
  | "expiring";

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

  return {
    listing,
    effectiveStatus,
    ownerStatusKey: getOwnerListingStatus(listing, effectiveStatus).key,
    photoCount,
    completenessPercent: ownerListingCompletenessPercent(listing, photoCount),
    leadStats,
    daysUntilExpiry: daysUntil(listing.expires_at),
  };
}

export function filterOwnerListings(
  rows: OwnerListingRowModel[],
  tab: ListingFilterTab
): OwnerListingRowModel[] {
  if (tab === "all") return rows;
  return rows.filter((row) => {
    switch (tab) {
      case "published":
        return row.ownerStatusKey === "published";
      case "review":
        return row.ownerStatusKey === "review" || row.ownerStatusKey === "needs_fixes";
      case "draft":
        return row.ownerStatusKey === "draft";
      case "paused":
        return row.ownerStatusKey === "paused";
      case "expired":
        return row.ownerStatusKey === "expired" || row.ownerStatusKey === "rejected";
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
    const haystack = [
      listing.title,
      listing.city,
      listing.area,
      listing.id,
    ]
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
        (a, b) => (b.listing.view_count ?? 0) - (a.listing.view_count ?? 0)
      );
    case "inquiries":
      return copy.sort(
        (a, b) => b.leadStats.total - a.leadStats.total
      );
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

export function countListingsByTab(rows: OwnerListingRowModel[]): Record<ListingFilterTab, number> {
  return {
    all: rows.length,
    published: rows.filter((r) => r.ownerStatusKey === "published").length,
    review: rows.filter(
      (r) => r.ownerStatusKey === "review" || r.ownerStatusKey === "needs_fixes"
    ).length,
    draft: rows.filter((r) => r.ownerStatusKey === "draft").length,
    paused: rows.filter((r) => r.ownerStatusKey === "paused").length,
    expired: rows.filter(
      (r) => r.ownerStatusKey === "expired" || r.ownerStatusKey === "rejected"
    ).length,
  };
}

export function buildOwnerListingsOverview(
  rows: OwnerListingRowModel[],
  newInquiries: number
): OwnerListingsOverview {
  const published = rows.filter((r) => r.ownerStatusKey === "published");
  const hasViewData = published.some((r) => (r.listing.view_count ?? 0) > 0);
  const viewsSum = published.reduce((sum, r) => sum + (r.listing.view_count ?? 0), 0);

  return {
    activeCount: published.length,
    viewsLast30Days: hasViewData ? viewsSum : null,
    newInquiries,
    needsActionCount: buildOwnerListingAlerts(rows, newInquiries).length,
  };
}

export function buildOwnerListingAlerts(
  rows: OwnerListingRowModel[],
  newInquiries: number
): OwnerListingAlert[] {
  const alerts: OwnerListingAlert[] = [];

  for (const row of rows) {
    const { listing, ownerStatusKey, photoCount, completenessPercent, daysUntilExpiry } =
      row;

    if (daysUntilExpiry != null && daysUntilExpiry >= 1 && daysUntilExpiry <= 14) {
      alerts.push({
        id: `expiring-${listing.id}`,
        message:
          daysUntilExpiry === 1
            ? `Η αγγελία «${listing.title}» λήγει αύριο`
            : `Η αγγελία «${listing.title}» λήγει σε ${daysUntilExpiry} ημέρες`,
        cta: "Ανανέωση",
        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,
        tone: daysUntilExpiry <= 6 ? "amber" : "gold",
      });
    }

    if (ownerStatusKey === "draft" && completenessPercent < 100) {
      alerts.push({
        id: `draft-${listing.id}`,
        message: `Η αγγελία «${listing.title}» χρειάζεται συμπλήρωση πριν υποβληθεί`,
        cta: "Συνέχισε τη συμπλήρωση",
        href: `/dashboard/listings/new?draft=${listing.id}`,
        tone: "gold",
      });
    }

    if (ownerStatusKey === "needs_fixes") {
      alerts.push({
        id: `fixes-${listing.id}`,
        message: `Η αγγελία «${listing.title}» χρειάζεται διορθώσεις`,
        cta: "Δες τις παρατηρήσεις",
        href: `/dashboard/listings/${listing.id}/edit`,
        tone: "amber",
      });
    }

    if (
      ownerStatusKey !== "published" &&
      ownerStatusKey !== "paused" &&
      photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW &&
      ownerStatusKey !== "draft"
    ) {
      alerts.push({
        id: `photos-${listing.id}`,
        message: `Η αγγελία «${listing.title}» χρειάζεται φωτογραφίες`,
        cta: "Πρόσθεσε φωτογραφίες",
        href: `/dashboard/listings/${listing.id}/photos`,
        tone: "neutral",
      });
    }
  }

  if (newInquiries > 0) {
    alerts.unshift({
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

  const seen = new Set<string>();
  return alerts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

export function listingNeedsCompletenessPanel(ownerStatusKey: OwnerListingStatusKey): boolean {
  return ownerStatusKey === "draft" || ownerStatusKey === "needs_fixes";
}

export { isOwnerListingDraft };
