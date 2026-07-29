import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import type { OwnerListingRowModel } from "@/lib/owner-listings-page";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";

/** Visual status shown on owner listing cards/rows (separate from rental mode). */
export type OwnerListingUiStatus =
  | "published"
  | "draft"
  | "action_required"
  | "ready"
  | "review"
  | "needs_fixes"
  | "inactive";

export type OwnerUiStatusLabelKey =
  | "published"
  | "draft"
  | "actionRequired"
  | "ready"
  | "review"
  | "needsFixes"
  | "inactive"
  | "expired"
  | "rejected";

export type OwnerUiStatusHelperKey =
  | "helperVisiblePublicly"
  | "helperActiveUntil"
  | "helperSubmittedForReview"
  | "helperChangesRequired"
  | "helperNotVisible"
  | "helperReady"
  | "helperMissingCount"
  | "helperMissingRequired"
  | "helperNotSubmitted";

export type OwnerListingUiStatusInfo = {
  key: OwnerListingUiStatus;
  styleKey: OwnerListingUiStatus;
  labelKey: OwnerUiStatusLabelKey;
  helperKey: OwnerUiStatusHelperKey;
  helperValues?: Record<string, string | number>;
};

export type OwnerCtaKey =
  | "continueDraft"
  | "preview"
  | "previewFull"
  | "seeReviewStatus"
  | "fixNow"
  | "seeNotes"
  | "viewListing"
  | "edit"
  | "reactivate"
  | "submitForReview"
  | "manage";

/** Maps raw owner status to a uiStatus label key (for badges without full row context). */
export function ownerStatusKeyToLabelKey(
  key: OwnerListingStatusKey
): OwnerUiStatusLabelKey {
  switch (key) {
    case "published":
      return "published";
    case "review":
      return "review";
    case "needs_fixes":
      return "needsFixes";
    case "rejected":
      return "rejected";
    case "paused":
      return "inactive";
    case "expired":
      return "expired";
    case "draft":
    default:
      return "draft";
  }
}

export function mapOwnerStatusKeyToUi(
  key: OwnerListingStatusKey
): OwnerListingUiStatus {
  switch (key) {
    case "published":
      return "published";
    case "review":
      return "review";
    case "needs_fixes":
    case "rejected":
      return "needs_fixes";
    case "paused":
    case "expired":
      return "inactive";
    case "draft":
    default:
      return "draft";
  }
}

export function resolveOwnerListingUiStatus(
  row: OwnerListingRowModel,
  locale: string = "el"
): OwnerListingUiStatusInfo {
  const { ownerStatusKey, completenessPercent, missingRequiredCount, listing } =
    row;
  const dateLocale = locale.startsWith("el") ? "el-GR" : "en-US";

  if (ownerStatusKey === "published") {
    const until = listing.expires_at
      ? formatOwnerListingDate(listing.expires_at, dateLocale)
      : null;
    return {
      key: "published",
      styleKey: "published",
      labelKey: "published",
      helperKey: until ? "helperActiveUntil" : "helperVisiblePublicly",
      helperValues: until ? { date: until } : undefined,
    };
  }

  if (ownerStatusKey === "review") {
    return {
      key: "review",
      styleKey: "review",
      labelKey: "review",
      helperKey: "helperSubmittedForReview",
    };
  }

  if (ownerStatusKey === "needs_fixes" || ownerStatusKey === "rejected") {
    return {
      key: "needs_fixes",
      styleKey: "needs_fixes",
      labelKey: ownerStatusKey === "rejected" ? "rejected" : "needsFixes",
      helperKey: "helperChangesRequired",
    };
  }

  if (ownerStatusKey === "paused" || ownerStatusKey === "expired") {
    return {
      key: "inactive",
      styleKey: "inactive",
      labelKey: ownerStatusKey === "expired" ? "expired" : "inactive",
      helperKey: "helperNotVisible",
    };
  }

  if (ownerStatusKey === "draft") {
    if (completenessPercent >= 100 && missingRequiredCount === 0) {
      return {
        key: "ready",
        styleKey: "ready",
        labelKey: "ready",
        helperKey: "helperReady",
      };
    }
    if (missingRequiredCount > 0 || completenessPercent < 100) {
      return {
        key: "action_required",
        styleKey: "action_required",
        labelKey: "actionRequired",
        helperKey:
          missingRequiredCount > 0
            ? "helperMissingCount"
            : "helperMissingRequired",
        helperValues:
          missingRequiredCount > 0
            ? { count: missingRequiredCount }
            : undefined,
      };
    }
    return {
      key: "draft",
      styleKey: "draft",
      labelKey: "draft",
      helperKey: "helperNotSubmitted",
    };
  }

  return {
    key: "draft",
    styleKey: "draft",
    labelKey: "draft",
    helperKey: "helperNotSubmitted",
  };
}

export function ownerListingPrimaryAction(row: OwnerListingRowModel): {
  labelKey: OwnerCtaKey;
  href: string;
  secondary?: { labelKey: OwnerCtaKey; href: string };
} {
  const ui = resolveOwnerListingUiStatus(row);
  const { listing, ownerStatusKey } = row;
  const previewHref = `/listings/${listing.slug ?? listing.id}`;
  const ownerViewHref = `/dashboard/listings/${listing.id}/view`;
  const editHref = `/dashboard/listings/${listing.id}/edit`;
  const publishHref = `/dashboard/listings/${listing.id}/publish`;
  const manageHref = `/dashboard/listings/${listing.id}`;
  const draftHref = ownerListingContinueWizardHref(listing.id);

  switch (ui.key) {
    case "action_required":
    case "draft":
      return {
        labelKey: "continueDraft",
        href: draftHref,
        secondary: { labelKey: "previewFull", href: ownerViewHref },
      };
    case "ready":
      return {
        labelKey: "submitForReview",
        href: publishHref,
        secondary: { labelKey: "previewFull", href: ownerViewHref },
      };
    case "published":
      return {
        labelKey: "viewListing",
        href: previewHref,
        secondary: { labelKey: "edit", href: editHref },
      };
    case "review":
      return {
        labelKey: "seeReviewStatus",
        href: manageHref,
        secondary: { labelKey: "previewFull", href: ownerViewHref },
      };
    case "needs_fixes":
      return {
        labelKey: "fixNow",
        href: draftHref,
        secondary: { labelKey: "seeNotes", href: `${editHref}#admin-notes` },
      };
    case "inactive":
      return {
        labelKey: ownerStatusKey === "expired" ? "reactivate" : "edit",
        href:
          ownerStatusKey === "expired"
            ? `/dashboard/listings/${listing.id}/pay?reactivate=1`
            : editHref,
        secondary: { labelKey: "edit", href: editHref },
      };
    default:
      return { labelKey: "manage", href: manageHref };
  }
}

/** Guided wizard resume URL for an existing listing (never creates a new draft). */
export function ownerListingContinueWizardHref(listingId: string): string {
  return `/dashboard/listings/new?draft=${encodeURIComponent(listingId)}`;
}

/**
 * Incomplete listings that need the guided “continue completion” path
 * (not healthy published / in-review / ready-to-submit listings).
 */
export function listingNeedsContinueCompletion(row: OwnerListingRowModel): boolean {
  const ui = resolveOwnerListingUiStatus(row);
  if (
    ui.key === "published" ||
    ui.key === "review" ||
    ui.key === "inactive" ||
    ui.key === "ready"
  ) {
    return false;
  }
  return (
    ui.key === "draft" ||
    ui.key === "action_required" ||
    ui.key === "needs_fixes"
  );
}
