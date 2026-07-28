import type { ListingWithImages, Profile } from "@/lib/types";

import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";

import {

  listingRentalType,

  listingSupportsShortTerm,

  requiresAmaRegistry,

} from "@/lib/rental-types";

import {

  completenessPercent,

  shortTermCompletenessItems,

  type CompletenessItem,

} from "@/lib/listing-completeness";

import { getOwnerListingStatus } from "@/lib/dashboard-listings";

import type { ListingDisplayStatus } from "@/lib/listing-status";



export type OwnerActionTone = "red" | "amber" | "green" | "neutral";



export type OwnerAlertTitleKey =

  | "verifyPhoneTitle"

  | "newInterestOne"

  | "newInterestMany"

  | "needsChangesTitle"

  | "inReviewTitle"

  | "addPhotosTitle"

  | "registryTitle"

  | "expiringTitle";



export type OwnerAlertDescriptionKey =

  | "verifyPhoneDesc"

  | "newInterestDesc"

  | "inReviewDesc"

  | "addPhotosDesc"

  | "registryDesc"

  | "expiringDesc";



export type OwnerAlertCtaKey =

  | "verifyPhoneCta"

  | "newInterestCta"

  | "needsChangesCta"

  | "inReviewCta"

  | "addPhotosCta"

  | "registryCta"

  | "expiringCta";



export type OwnerActionItem = {

  id: string;

  titleKey: OwnerAlertTitleKey;

  titleValues?: Record<string, string | number>;

  descriptionKey?: OwnerAlertDescriptionKey;

  descriptionValues?: Record<string, string | number>;

  descriptionFallback?: string;

  href: string;

  ctaKey: OwnerAlertCtaKey;

  tone: OwnerActionTone;

};



export type OwnerNotificationTitleKey =

  | "newInterestTitle"

  | "phoneTitle"

  | "needsChangesTitle"

  | "approvedTitle"

  | "rejectedTitle"

  | "expiringTitle";



export type OwnerNotificationBodyKey =

  | "newInterestBodyOne"

  | "newInterestBodyMany"

  | "phoneBody"

  | "expiringBody";



export type OwnerNotification = {

  id: string;

  titleKey: OwnerNotificationTitleKey;

  titleValues?: Record<string, string | number>;

  bodyKey?: OwnerNotificationBodyKey;

  bodyValues?: Record<string, string | number>;

  bodyFallback?: string;

  href: string;

  createdAt: string;

  read: boolean;

};



export type ProfileCompletionItemId = "name" | "phone" | "avatar" | "bio" | "languages";



export type ProfileCompletionItem = {

  id: ProfileCompletionItemId;

  done: boolean;

  href: string;

  required: boolean;

};



export type OwnerCompletenessItemId =

  | "photos"

  | "location"

  | "price"

  | "availability"

  | "verification"

  | "registry";



export type OwnerCtaKey =

  | "submitForReview"

  | "continueDraft"

  | "previewFull"

  | "seeReviewStatus"

  | "fixNow"

  | "seeNotes"

  | "viewListing"

  | "edit"

  | "reactivate";



export function ownerListingCompletenessItems(

  listing: ListingWithImages,

  photoCount: number

): CompletenessItem[] {

  const shortItems = shortTermCompletenessItems(listing, photoCount);

  if (shortItems.length > 0) return shortItems.filter((i) => i.required);



  const needsAma = requiresAmaRegistry(

    listingRentalType(listing),

    listing.accepts_under_60_days

  );



  return [

    {

      id: "photos",

      label: "photos",

      done: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,

      required: true,

    },

    {

      id: "location",

      label: "location",

      done: Boolean(

        listing.latitude != null &&

          listing.longitude != null &&

          listing.location_confirmed_by_owner

      ),

      required: true,

    },

    {

      id: "price",

      label: "price",

      done: (listing.price_monthly ?? 0) > 0,

      required: true,

    },

    {

      id: "availability",

      label: "availability",

      done: Boolean(listing.availability_status || listing.available_from),

      required: true,

    },

    {

      id: "verification",

      label: "verification",

      done:

        listing.property_verification_status === "verified" ||

        listing.advertiser_verification_status === "verified",

      required: false,

    },

    {

      id: "registry",

      label: "registry",

      done: Boolean(listing.ama_number?.trim() && listing.legal_registry_type !== "none"),

      required: needsAma,

    },

  ].filter((i) => i.required || i.id === "verification");

}



export function ownerListingCompletenessPercent(

  listing: ListingWithImages,

  photoCount: number

): number {

  return completenessPercent(ownerListingCompletenessItems(listing, photoCount));

}



export function profileCompletionItems(

  profile: Profile,

  _email: string

): ProfileCompletionItem[] {

  return [

    {

      id: "name",

      done: Boolean(profile.full_name?.trim()),

      href: "/dashboard/profile",

      required: true,

    },

    {

      id: "phone",

      done: Boolean(profile.phone?.trim()),

      href: "/dashboard/settings/contact",

      required: true,

    },

    {

      id: "avatar",

      done: Boolean(profile.avatar_path?.trim() && profile.avatar_status === "active"),

      href: "/dashboard/profile",

      required: false,

    },

    {

      id: "bio",

      done: Boolean(profile.bio?.trim()),

      href: "/dashboard/profile",

      required: false,

    },

    {

      id: "languages",

      done: Boolean(profile.communication_languages?.length),

      href: "/dashboard/profile",

      required: false,

    },

  ];

}



export function profileCompletionPercent(profile: Profile, email: string): number {

  const items = profileCompletionItems(profile, email);

  const required = items.filter((i) => i.required);

  const recommended = items.filter((i) => !i.required);

  const requiredDone = required.filter((i) => i.done).length;

  const recommendedDone = recommended.filter((i) => i.done).length;

  const requiredPct = required.length ? (requiredDone / required.length) * 70 : 70;

  const recommendedPct = recommended.length

    ? (recommendedDone / recommended.length) * 30

    : 30;

  return Math.round(requiredPct + recommendedPct);

}



export function profileRequiredComplete(profile: Profile, email: string): boolean {

  return profileCompletionItems(profile, email)

    .filter((i) => i.required)

    .every((i) => i.done);

}



function daysUntil(iso: string | null | undefined): number | null {

  if (!iso) return null;

  const diff = new Date(iso).getTime() - Date.now();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));

}



export function buildOwnerActionItems(input: {

  profile: Profile;

  listings: ListingWithImages[];

  newLeadsCount: number;

  getEffectiveStatus: (listing: ListingWithImages) => ListingDisplayStatus;

}): OwnerActionItem[] {

  const items: OwnerActionItem[] = [];



  if (!input.profile.primary_phone_verified_at) {

    items.push({

      id: "verify-phone",

      titleKey: "verifyPhoneTitle",

      descriptionKey: "verifyPhoneDesc",

      href: "/dashboard/settings/contact",

      ctaKey: "verifyPhoneCta",

      tone: "amber",

    });

  }



  if (input.newLeadsCount > 0) {

    items.push({

      id: "new-leads",

      titleKey: input.newLeadsCount === 1 ? "newInterestOne" : "newInterestMany",

      titleValues: input.newLeadsCount === 1 ? undefined : { count: input.newLeadsCount },

      descriptionKey: "newInterestDesc",

      href: "/dashboard/requests",

      ctaKey: "newInterestCta",

      tone: "red",

    });

  }



  for (const listing of input.listings) {

    const effective = input.getEffectiveStatus(listing);

    const ownerStatus = getOwnerListingStatus(listing, effective);

    const photoCount =

      listing.listing_images?.filter((i) => i.media_type !== "video").length ?? 0;



    if (listing.approval_status === "needs_changes") {

      items.push({

        id: `needs-changes-${listing.id}`,

        titleKey: "needsChangesTitle",

        descriptionFallback:

          listing.admin_verification_notes?.slice(0, 120) || listing.title,

        href: `/dashboard/listings/${listing.id}/edit`,

        ctaKey: "needsChangesCta",

        tone: "red",

      });

      continue;

    }



    if (ownerStatus.key === "review") {

      items.push({

        id: `review-${listing.id}`,

        titleKey: "inReviewTitle",

        descriptionKey: "inReviewDesc",

        descriptionValues: { title: listing.title },

        href: "/dashboard/listings",

        ctaKey: "inReviewCta",

        tone: "neutral",

      });

    }



    if (

      photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW &&

      ownerStatus.key !== "published" &&

      ownerStatus.key !== "paused"

    ) {

      items.push({

        id: `photos-${listing.id}`,

        titleKey: "addPhotosTitle",

        descriptionKey: "addPhotosDesc",

        descriptionValues: {

          title: listing.title,

          count: MIN_LISTING_PHOTOS_FOR_REVIEW,

        },

        href: `/dashboard/listings/${listing.id}/photos`,

        ctaKey: "addPhotosCta",

        tone: "amber",

      });

    }



    const needsAma = requiresAmaRegistry(

      listingRentalType(listing),

      listing.accepts_under_60_days

    );

    if (

      needsAma &&

      (!listing.ama_number?.trim() || listing.legal_registry_type === "none") &&

      ownerStatus.key !== "published" &&

      ownerStatus.key !== "paused"

    ) {

      items.push({

        id: `registry-${listing.id}`,

        titleKey: "registryTitle",

        descriptionKey: "registryDesc",

        descriptionValues: { title: listing.title },

        href: `/dashboard/listings/${listing.id}/edit`,

        ctaKey: "registryCta",

        tone: "amber",

      });

    }



    const daysLeft = daysUntil(listing.expires_at);

    if (effective === "approved" && daysLeft != null && daysLeft <= 7 && daysLeft >= 0) {

      items.push({

        id: `expiring-${listing.id}`,

        titleKey: "expiringTitle",

        descriptionKey: "expiringDesc",

        descriptionValues: { title: listing.title, days: daysLeft },

        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,

        ctaKey: "expiringCta",

        tone: "amber",

      });

    }

  }



  const seen = new Set<string>();

  return items.filter((item) => {

    if (seen.has(item.id)) return false;

    seen.add(item.id);

    return true;

  });

}



export function buildOwnerNotifications(input: {

  profile: Profile;

  listings: ListingWithImages[];

  newLeadsCount: number;

  getEffectiveStatus: (listing: ListingWithImages) => ListingDisplayStatus;

}): OwnerNotification[] {

  const notifications: OwnerNotification[] = [];

  const now = new Date().toISOString();



  if (input.newLeadsCount > 0) {

    notifications.push({

      id: "lead-new",

      titleKey: "newInterestTitle",

      bodyKey: input.newLeadsCount === 1 ? "newInterestBodyOne" : "newInterestBodyMany",

      bodyValues: input.newLeadsCount === 1 ? undefined : { count: input.newLeadsCount },

      href: "/dashboard/requests",

      createdAt: now,

      read: false,

    });

  }



  if (!input.profile.primary_phone_verified_at) {

    notifications.push({

      id: "phone-unverified",

      titleKey: "phoneTitle",

      bodyKey: "phoneBody",

      href: "/dashboard/settings/contact",

      createdAt: now,

      read: false,

    });

  }



  for (const listing of input.listings) {

    if (listing.approval_status === "needs_changes") {

      notifications.push({

        id: `changes-${listing.id}`,

        titleKey: "needsChangesTitle",

        bodyFallback: listing.title,

        href: `/dashboard/listings/${listing.id}/edit`,

        createdAt: listing.updated_at ?? now,

        read: false,

      });

    } else if (listing.approval_status === "approved" && listing.status === "approved") {

      const publishedAt = listing.published_at;

      if (publishedAt) {

        const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;

        if (ageHours < 48) {

          notifications.push({

            id: `approved-${listing.id}`,

            titleKey: "approvedTitle",

            bodyFallback: listing.title,

            href: `/listings/${listing.id}`,

            createdAt: publishedAt,

            read: true,

          });

        }

      }

    } else if (listing.approval_status === "rejected") {

      notifications.push({

        id: `rejected-${listing.id}`,

        titleKey: "rejectedTitle",

        bodyFallback: listing.title,

        href: `/dashboard/listings/${listing.id}/edit`,

        createdAt: listing.updated_at ?? now,

        read: false,

      });

    }



    const daysLeft = daysUntil(listing.expires_at);

    if (daysLeft != null && daysLeft <= 7 && daysLeft >= 0) {

      notifications.push({

        id: `expire-${listing.id}`,

        titleKey: "expiringTitle",

        bodyKey: "expiringBody",

        bodyValues: { title: listing.title, days: daysLeft },

        href: `/dashboard/listings/${listing.id}/pay?reactivate=1`,

        createdAt: now,

        read: false,

      });

    }

  }



  return notifications

    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    .slice(0, 20);

}



export function listingPrimaryCta(

  listing: ListingWithImages,

  effectiveStatus: ListingDisplayStatus

): { labelKey: OwnerCtaKey; href: string; secondary?: { labelKey: OwnerCtaKey; href: string } } {

  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);

  const previewHref = `/listings/${listing.slug ?? listing.id}`;

  const ownerViewHref = `/dashboard/listings/${listing.id}/view`;

  const editHref = `/dashboard/listings/${listing.id}/edit`;

  const publishHref = `/dashboard/listings/${listing.id}/publish`;

  const reactivateHref = `/dashboard/listings/${listing.id}/pay?reactivate=1`;

  const photoCount =

    listing.listing_images?.filter((i) => i.media_type !== "video").length ?? 0;

  const draftReady = ownerListingCompletenessPercent(listing, photoCount) >= 100;



  switch (ownerStatus.key) {

    case "draft":

      return draftReady

        ? {

            labelKey: "submitForReview",

            href: publishHref,

            secondary: { labelKey: "previewFull", href: ownerViewHref },

          }

        : {

            labelKey: "continueDraft",

            href: `/dashboard/listings/new?draft=${listing.id}`,

            secondary: { labelKey: "previewFull", href: ownerViewHref },

          };

    case "review":

      return {

        labelKey: "seeReviewStatus",

        href: `/dashboard/listings/${listing.id}`,

        secondary: { labelKey: "previewFull", href: ownerViewHref },

      };

    case "needs_fixes":

      return {

        labelKey: "fixNow",

        href: editHref,

        secondary: { labelKey: "seeNotes", href: `${editHref}#admin-notes` },

      };

    case "published":

      return {

        labelKey: "viewListing",

        href: previewHref,

        secondary: { labelKey: "edit", href: editHref },

      };

    case "paused":

      return {

        labelKey: "edit",

        href: editHref,

        secondary: { labelKey: "viewListing", href: previewHref },

      };

    case "expired":

      return {

        labelKey: "reactivate",

        href: reactivateHref,

        secondary: { labelKey: "edit", href: editHref },

      };

    case "rejected":

      return {

        labelKey: "edit",

        href: editHref,

        secondary: { labelKey: "seeNotes", href: `${editHref}#admin-notes` },

      };

    default:

      return { labelKey: "edit", href: editHref };

  }

}



export function listingHasDualModes(_listing: ListingWithImages): boolean {

  return false;

}


