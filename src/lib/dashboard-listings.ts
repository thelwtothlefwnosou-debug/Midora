import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";
import { pickLocale } from "@/lib/locale-fallbacks";

export type OwnerListingStatusKey =
  | "draft"
  | "review"
  | "needs_fixes"
  | "published"
  | "paused"
  | "expired"
  | "rejected";

export type OwnerListingStatus = {
  key: OwnerListingStatusKey;
  /** @deprecated Prefer `labelKey` + `Owner.uiStatus` in UI */
  label: string;
  labelKey: keyof typeof OWNER_STATUS_LABEL_KEYS;
  helperKey?: keyof typeof OWNER_STATUS_HELPER_KEYS;
  helperText?: string;
};

const OWNER_STATUS_LABEL_KEYS = {
  needs_fixes: "needsFixes",
  rejected: "rejected",
  expired: "expired",
  paused: "inactive",
  published: "published",
  draft: "draft",
  review: "review",
} as const;

export function getOwnerListingUiLabelKey(key: OwnerListingStatusKey): string {
  return OWNER_STATUS_LABEL_KEYS[key];
}

const OWNER_STATUS_LABELS_EL: Record<OwnerListingStatusKey, string> = {
  needs_fixes: "Θέλει διόρθωση",
  rejected: "Απορρίφθηκε",
  expired: "Έληξε",
  paused: "Ανενεργή",
  published: "Δημοσιευμένη",
  draft: "Πρόχειρη",
  review: "Σε έλεγχο",
};

const OWNER_STATUS_LABELS_EN: Record<OwnerListingStatusKey, string> = {
  needs_fixes: "Needs fixes",
  rejected: "Rejected",
  expired: "Expired",
  paused: "Inactive",
  published: "Published",
  draft: "Draft",
  review: "Under review",
};

/** Deprecated Greek/English fallback when `Owner.uiStatus` translator is unavailable. */
export function getOwnerListingStatusLabel(
  key: OwnerListingStatusKey,
  locale?: string
): string {
  return pickLocale(locale, OWNER_STATUS_LABELS_EL[key], OWNER_STATUS_LABELS_EN[key]);
}

const OWNER_STATUS_HELPER_EL: Partial<Record<OwnerListingStatusKey, string>> = {
  needs_fixes: "Απαιτούνται αλλαγές πριν δημοσιευτεί",
  rejected: "Δεν εμφανίζεται δημόσια",
  expired: "Δεν εμφανίζεται δημόσια",
  paused: "Δεν εμφανίζεται δημόσια",
  draft: "Δεν έχει υποβληθεί ακόμα",
  review: "Υποβλήθηκε για έλεγχο",
};

const OWNER_STATUS_HELPER_EN: Partial<Record<OwnerListingStatusKey, string>> = {
  needs_fixes: "Changes are required before publishing",
  rejected: "Not visible publicly",
  expired: "Not visible publicly",
  paused: "Not visible publicly",
  draft: "Not submitted yet",
  review: "Submitted for review",
};

const OWNER_STATUS_HELPER_KEYS = {
  needs_fixes: "helperChangesRequired",
  rejected: "helperNotVisible",
  expired: "helperNotVisible",
  paused: "helperNotVisible",
  draft: "helperNotSubmitted",
  review: "helperSubmittedForReview",
} as const;

export function getOwnerListingStatus(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  locale?: string
): OwnerListingStatus {
  const hasPhotos = (listing.listing_images?.length ?? 0) > 0;

  if (listing.approval_status === "needs_changes") {
    return {
      key: "needs_fixes",
      label: getOwnerListingStatusLabel("needs_fixes", locale),
      labelKey: "needs_fixes",
      helperKey: "needs_fixes",
      helperText: pickLocale(
        locale,
        OWNER_STATUS_HELPER_EL.needs_fixes!,
        OWNER_STATUS_HELPER_EN.needs_fixes!
      ),
    };
  }

  // Submitted for review must stay "review" even if photos fail to join / load.
  if (listing.approval_status === "pending_review") {
    return {
      key: "review",
      label: getOwnerListingStatusLabel("review", locale),
      labelKey: "review",
      helperKey: "review",
      helperText: pickLocale(
        locale,
        OWNER_STATUS_HELPER_EL.review!,
        OWNER_STATUS_HELPER_EN.review!
      ),
    };
  }

  if (effectiveStatus === "rejected") {
    return {
      key: "rejected",
      label: getOwnerListingStatusLabel("rejected", locale),
      labelKey: "rejected",
      helperKey: "rejected",
      helperText: pickLocale(
        locale,
        OWNER_STATUS_HELPER_EL.rejected!,
        OWNER_STATUS_HELPER_EN.rejected!
      ),
    };
  }

  if (effectiveStatus === "expired") {
    return {
      key: "expired",
      label: getOwnerListingStatusLabel("expired", locale),
      labelKey: "expired",
      helperKey: "expired",
      helperText: pickLocale(
        locale,
        OWNER_STATUS_HELPER_EL.expired!,
        OWNER_STATUS_HELPER_EN.expired!
      ),
    };
  }

  if (effectiveStatus === "approved" && listing.is_hidden) {
    return {
      key: "paused",
      label: getOwnerListingStatusLabel("paused", locale),
      labelKey: "paused",
      helperKey: "paused",
      helperText: pickLocale(
        locale,
        OWNER_STATUS_HELPER_EL.paused!,
        OWNER_STATUS_HELPER_EN.paused!
      ),
    };
  }

  if (effectiveStatus === "approved") {
    return {
      key: "published",
      label: getOwnerListingStatusLabel("published", locale),
      labelKey: "published",
    };
  }

  const isDraft =
    listing.approval_status === "draft" ||
    (effectiveStatus === "pending" && !hasPhotos);

  if (isDraft) {
    return {
      key: "draft",
      label: getOwnerListingStatusLabel("draft", locale),
      labelKey: "draft",
      helperKey: "draft",
      helperText: pickLocale(
        locale,
        OWNER_STATUS_HELPER_EL.draft!,
        OWNER_STATUS_HELPER_EN.draft!
      ),
    };
  }

  return {
    key: "review",
    label: getOwnerListingStatusLabel("review", locale),
    labelKey: "review",
    helperKey: "review",
    helperText: pickLocale(
      locale,
      OWNER_STATUS_HELPER_EL.review!,
      OWNER_STATUS_HELPER_EN.review!
    ),
  };
}

export function isOwnerListingDraft(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus
): boolean {
  return getOwnerListingStatus(listing, effectiveStatus).key === "draft";
}

export function formatOwnerListingDate(
  iso: string | null | undefined,
  locale: string = "el-GR"
): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ownerListingStatusHelper(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  ownerKey: OwnerListingStatusKey,
  locale?: string
): string | null {
  const status = getOwnerListingStatus(listing, effectiveStatus, locale);
  if (status.helperText) return status.helperText;

  const dateLocale = locale === "en" ? "en-US" : "el-GR";

  if (ownerKey === "published") {
    if (listing.expires_at) {
      const d = formatOwnerListingDate(listing.expires_at, dateLocale);
      if (d) {
        return pickLocale(locale, `Ενεργή έως ${d}`, `Active until ${d}`);
      }
    }
    if (listing.published_at) {
      const d = formatOwnerListingDate(listing.published_at, dateLocale);
      return d
        ? pickLocale(locale, `Δημοσιεύτηκε στις ${d}`, `Published on ${d}`)
        : null;
    }
  }
  if (ownerKey === "review") {
    const d = formatOwnerListingDate(listing.updated_at, dateLocale);
    return d
      ? pickLocale(locale, `Υποβλήθηκε στις ${d}`, `Submitted on ${d}`)
      : pickLocale(locale, "Υποβλήθηκε για έλεγχο", "Submitted for review");
  }
  if (ownerKey === "expired" && listing.expires_at) {
    const d = formatOwnerListingDate(listing.expires_at, dateLocale);
    return d
      ? pickLocale(locale, `Έληξε στις ${d}`, `Expired on ${d}`)
      : pickLocale(locale, "Δεν εμφανίζεται δημόσια", "Not visible publicly");
  }
  if (ownerKey === "draft") {
    return pickLocale(locale, "Δεν έχει υποβληθεί ακόμα", "Not submitted yet");
  }
  if (ownerKey === "needs_fixes") {
    return pickLocale(
      locale,
      "Απαιτούνται αλλαγές πριν δημοσιευτεί",
      "Changes are required before publishing"
    );
  }
  if (ownerKey === "paused" || ownerKey === "rejected") {
    return pickLocale(locale, "Δεν εμφανίζεται δημόσια", "Not visible publicly");
  }
  return null;
}

export function countListingsByOwnerStatus(
  listings: ListingWithImages[],
  getEffective: (listing: ListingWithImages) => ListingDisplayStatus
) {
  let published = 0;
  let draft = 0;
  let review = 0;
  let verified = 0;

  for (const listing of listings) {
    const status = getOwnerListingStatus(listing, getEffective(listing));
    if (status.key === "published") published += 1;
    if (status.key === "draft") draft += 1;
    if (status.key === "review" || status.key === "needs_fixes") review += 1;
    if (
      listing.status === "approved" ||
      listing.property_verification_status === "verified" ||
      listing.advertiser_verification_status === "verified"
    ) {
      verified += 1;
    }
  }

  return {
    active: published,
    draft,
    review,
    verified,
    total: listings.length,
  };
}
