import type { ListingWithImages } from "@/lib/types";
import type { ListingDisplayStatus } from "@/lib/listing-status";

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
  label: string;
  helperText?: string;
};

export function getOwnerListingStatus(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus
): OwnerListingStatus {
  const hasPhotos = (listing.listing_images?.length ?? 0) > 0;

  if (listing.approval_status === "needs_changes") {
    const fixCount = listing.admin_verification_notes
      ? Math.max(1, listing.admin_verification_notes.split(/\n|•|-/).filter(Boolean).length)
      : 1;
    return {
      key: "needs_fixes",
      label: "Χρειάζεται διόρθωση",
      helperText:
        fixCount > 1
          ? `Υπάρχουν ${Math.min(fixCount, 9)} σημεία προς διόρθωση`
          : "Υπάρχει 1 σημείο προς διόρθωση",
    };
  }

  if (effectiveStatus === "rejected") {
    return { key: "rejected", label: "Απορρίφθηκε" };
  }

  if (effectiveStatus === "expired") {
    return { key: "expired", label: "Έληξε" };
  }

  if (effectiveStatus === "approved" && listing.is_hidden) {
    return { key: "paused", label: "Σε παύση" };
  }

  if (effectiveStatus === "approved") {
    return { key: "published", label: "Δημοσιευμένη" };
  }

  const isDraft =
    listing.approval_status === "draft" ||
    (effectiveStatus === "pending" && !hasPhotos);

  if (isDraft) {
    return { key: "draft", label: "Πρόχειρη" };
  }

  return { key: "review", label: "Σε έλεγχο" };
}

export function isOwnerListingDraft(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus
): boolean {
  return getOwnerListingStatus(listing, effectiveStatus).key === "draft";
}

export function formatOwnerListingDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ownerListingStatusHelper(
  listing: ListingWithImages,
  effectiveStatus: ListingDisplayStatus,
  ownerKey: OwnerListingStatusKey
): string | null {
  const status = getOwnerListingStatus(listing, effectiveStatus);
  if (status.helperText) return status.helperText;

  if (ownerKey === "published" && listing.published_at) {
    const d = formatOwnerListingDate(listing.published_at);
    return d ? `Δημοσιεύτηκε στις ${d}` : null;
  }
  if (ownerKey === "review") {
    const d = formatOwnerListingDate(listing.updated_at);
    return d ? `Υποβλήθηκε στις ${d}` : null;
  }
  if (ownerKey === "expired" && listing.expires_at) {
    const d = formatOwnerListingDate(listing.expires_at);
    return d ? `Έληξε στις ${d}` : null;
  }
  if (ownerKey === "draft") {
    return "Δεν έχει δημοσιευτεί ακόμα";
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
