/** In-app notification types and row shape (user_notifications table). */

export const NOTIFICATION_TYPES = [
  "lead_new_short",
  "lead_new_monthly",
  "lead_reply",
  "listing_pending_review",
  "listing_published",
  "listing_needs_changes",
  "listing_rejected",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Keys under messages Notifications.items.* */
export type NotificationMessageKey =
  | "leadNewShortTitle"
  | "leadNewShortBody"
  | "leadNewMonthlyTitle"
  | "leadNewMonthlyBody"
  | "leadReplyTitle"
  | "leadReplyBody"
  | "listingPendingReviewTitle"
  | "listingPendingReviewBody"
  | "listingPublishedTitle"
  | "listingPublishedBody"
  | "listingNeedsChangesTitle"
  | "listingNeedsChangesBody"
  | "listingRejectedTitle"
  | "listingRejectedBody";

export type NotificationBodyParams = Record<string, string | number>;

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  titleKey: NotificationMessageKey;
  bodyKey: NotificationMessageKey | null;
  bodyParams: NotificationBodyParams;
  entityType: string | null;
  entityId: string | null;
  href: string;
  dedupeKey: string;
  readAt: string | null;
  createdAt: string;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  titleKey: NotificationMessageKey;
  bodyKey?: NotificationMessageKey | null;
  bodyParams?: NotificationBodyParams;
  entityType?: string | null;
  entityId?: string | null;
  href: string;
  dedupeKey: string;
  /** When true, refresh body/created_at and clear read_at on conflict. */
  refreshOnConflict?: boolean;
};
