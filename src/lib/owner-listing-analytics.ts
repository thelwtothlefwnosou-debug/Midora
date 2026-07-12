import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import { getDisplayViewCount } from "@/lib/listing-views";

export type ListingAnalytics = {
  viewsTotal: number | null;
  viewsLast7Days: number | null;
  viewsLast30Days: number | null;
  uniqueViewersLast30Days: number | null;
  inquiriesTotal: number;
  inquiriesLast30Days: number;
  unreadInquiries: number;
  messagesLast30Days: number | null;
  unreadMessages: number | null;
  phoneClicksLast30Days: number | null;
  savesLast30Days: number | null;
};

export type ListingLeadStats = {
  total: number;
  last30Days: number;
  unread: number;
};

export function buildListingAnalytics(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  ownerStatusKey: OwnerListingStatusKey,
  leadStats?: ListingLeadStats
): ListingAnalytics {
  const published = ownerStatusKey === "published" || ownerStatusKey === "paused";
  const displayViews = published ? getDisplayViewCount(listing) : null;

  return {
    viewsTotal: displayViews,
    viewsLast7Days: null,
    viewsLast30Days: null,
    uniqueViewersLast30Days: null,
    inquiriesTotal: leadStats?.total ?? 0,
    inquiriesLast30Days: leadStats?.last30Days ?? 0,
    unreadInquiries: leadStats?.unread ?? 0,
    messagesLast30Days: null,
    unreadMessages: null,
    phoneClicksLast30Days: null,
    savesLast30Days: null,
  };
}

export function hasListingPerformanceData(analytics: ListingAnalytics): boolean {
  return (
    (analytics.viewsTotal != null && analytics.viewsTotal > 0) ||
    analytics.inquiriesTotal > 0 ||
    analytics.inquiriesLast30Days > 0
  );
}

export function formatAnalyticsMetric(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}
