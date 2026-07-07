import type { ListingWithImages } from "@/lib/types";
import { getListingCompleteness } from "@/lib/admin/listing-completeness";
import { listingRentalType, requiresAmaRegistry } from "@/lib/rental-types";
import { getAdminRegistryDisplay } from "@/lib/admin/registry-display";

export type ListingPriority = "critical" | "high" | "medium" | "low";

export type PriorityListingMeta = {
  listing: ListingWithImages;
  priority: ListingPriority;
  priorityScore: number;
  missingLabels: string[];
  riskBadges: string[];
  reportCount: number;
};

const PRIORITY_WEIGHT: Record<ListingPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function scoreListingPriority(
  listing: ListingWithImages,
  reportCount = 0
): PriorityListingMeta {
  const completeness = getListingCompleteness(listing);
  const rentalType = listingRentalType(listing);
  const needsRegistry = requiresAmaRegistry(rentalType, listing.accepts_under_60_days);
  const registry = getAdminRegistryDisplay(listing);
  const riskBadges: string[] = [];
  let score = 0;

  if (reportCount > 0) {
    score += 100 + reportCount * 20;
    riskBadges.push(reportCount > 1 ? `${reportCount} αναφορές` : "Αναφορά");
  }

  if (listing.approval_status === "pending_review" || listing.status === "pending") {
    score += 50;
  }

  if (listing.approval_status === "needs_changes") {
    score += 30;
  }

  if (needsRegistry && registry.kind !== "value") {
    score += 25;
    riskBadges.push("Έλεγχος ΑΜΑ");
  }

  if (
    listing.latitude == null ||
    listing.longitude == null ||
    !listing.location_confirmed_by_owner ||
    listing.location_admin_status === "needs_correction"
  ) {
    score += 20;
    riskBadges.push("Τοποθεσία");
  }

  if (completeness.missingLabels.length > 0) {
    score += completeness.missingLabels.length * 5;
  }

  const ageMs = Date.now() - new Date(listing.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 3 && listing.status === "pending") {
    score += 15;
    riskBadges.push("Καθυστέρηση");
  }

  let priority: ListingPriority = "low";
  if (score >= 100) priority = "critical";
  else if (score >= 60) priority = "high";
  else if (score >= 30) priority = "medium";

  return {
    listing,
    priority,
    priorityScore: score + PRIORITY_WEIGHT[priority],
    missingLabels: completeness.missingLabels,
    riskBadges,
    reportCount,
  };
}

export function sortByPriority(items: PriorityListingMeta[]): PriorityListingMeta[] {
  return [...items].sort((a, b) => b.priorityScore - a.priorityScore);
}

export function formatRelativeTimeGreek(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "μόλις τώρα";
  if (mins < 60) return `πριν ${mins} λεπ.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `πριν ${hours} ώρ.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `πριν ${days} ημ.`;
  return new Date(iso).toLocaleDateString("el-GR");
}
