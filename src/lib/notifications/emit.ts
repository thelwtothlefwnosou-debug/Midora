import { createUserNotification } from "@/lib/notifications/create";
import { listingRentalType } from "@/lib/rental-types";
import type { Listing } from "@/lib/types";

function listingTitle(listing: Pick<Listing, "title"> | { title?: string | null }) {
  return (listing.title ?? "").trim() || "Αγγελία";
}

/** Owner: new short-term or monthly inquiry (no message body in payload). */
export async function notifyOwnerNewLead(input: {
  ownerId: string;
  leadId: string;
  listingId: string;
  listing: Pick<Listing, "title" | "rental_type">;
}) {
  const rental = listingRentalType(input.listing as Listing);
  const isMonthly = rental === "monthly" || rental === "long_term";
  const title = listingTitle(input.listing);

  await createUserNotification({
    userId: input.ownerId,
    type: isMonthly ? "lead_new_monthly" : "lead_new_short",
    titleKey: isMonthly ? "leadNewMonthlyTitle" : "leadNewShortTitle",
    bodyKey: isMonthly ? "leadNewMonthlyBody" : "leadNewShortBody",
    bodyParams: { title },
    entityType: "property_lead",
    entityId: input.leadId,
    href: `/dashboard/listings/${input.listingId}/inquiries`,
    dedupeKey: `lead_new:${input.leadId}`,
  });
}

/** Guest: host/cohost replied to their inquiry (no reply text in payload). */
export async function notifyGuestLeadReply(input: {
  guestId: string;
  leadId: string;
  listingId: string;
  replyId: string;
  listingTitle: string;
}) {
  await createUserNotification({
    userId: input.guestId,
    type: "lead_reply",
    titleKey: "leadReplyTitle",
    bodyKey: "leadReplyBody",
    bodyParams: { title: input.listingTitle },
    entityType: "property_lead",
    entityId: input.leadId,
    href: `/dashboard/messages`,
    dedupeKey: `lead_reply:${input.replyId}`,
  });
}

export async function notifyOwnerListingPendingReview(input: {
  ownerId: string;
  listingId: string;
  listingTitle: string;
}) {
  await createUserNotification({
    userId: input.ownerId,
    type: "listing_pending_review",
    titleKey: "listingPendingReviewTitle",
    bodyKey: "listingPendingReviewBody",
    bodyParams: { title: input.listingTitle },
    entityType: "listing",
    entityId: input.listingId,
    href: `/dashboard/listings/${input.listingId}`,
    dedupeKey: `listing_status:${input.listingId}:pending_review`,
    refreshOnConflict: true,
  });
}

export async function notifyOwnerListingPublished(input: {
  ownerId: string;
  listingId: string;
  listingTitle: string;
}) {
  await createUserNotification({
    userId: input.ownerId,
    type: "listing_published",
    titleKey: "listingPublishedTitle",
    bodyKey: "listingPublishedBody",
    bodyParams: { title: input.listingTitle },
    entityType: "listing",
    entityId: input.listingId,
    href: `/listings/${input.listingId}`,
    dedupeKey: `listing_status:${input.listingId}:published`,
    refreshOnConflict: true,
  });
}

export async function notifyOwnerListingNeedsChanges(input: {
  ownerId: string;
  listingId: string;
  listingTitle: string;
}) {
  await createUserNotification({
    userId: input.ownerId,
    type: "listing_needs_changes",
    titleKey: "listingNeedsChangesTitle",
    bodyKey: "listingNeedsChangesBody",
    bodyParams: { title: input.listingTitle },
    entityType: "listing",
    entityId: input.listingId,
    href: `/dashboard/listings/${input.listingId}/edit`,
    dedupeKey: `listing_status:${input.listingId}:needs_changes`,
    refreshOnConflict: true,
  });
}

export async function notifyOwnerListingRejected(input: {
  ownerId: string;
  listingId: string;
  listingTitle: string;
}) {
  await createUserNotification({
    userId: input.ownerId,
    type: "listing_rejected",
    titleKey: "listingRejectedTitle",
    bodyKey: "listingRejectedBody",
    bodyParams: { title: input.listingTitle },
    entityType: "listing",
    entityId: input.listingId,
    href: `/dashboard/listings/${input.listingId}/edit`,
    dedupeKey: `listing_status:${input.listingId}:rejected`,
    refreshOnConflict: true,
  });
}
