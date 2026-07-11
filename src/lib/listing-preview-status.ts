import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";

export type ListingPreviewStatusMessage = {
  tone: "neutral" | "info" | "success" | "warning";
  text: string;
};

export function listingPreviewStatusMessage(
  ownerStatusKey: OwnerListingStatusKey
): ListingPreviewStatusMessage {
  switch (ownerStatusKey) {
    case "published":
    case "paused":
      return {
        tone: "success",
        text: "Η αγγελία εμφανίζεται δημόσια.",
      };
    case "review":
      return {
        tone: "info",
        text: "Η αγγελία είναι σε έλεγχο και θα εμφανιστεί δημόσια μετά την έγκριση.",
      };
    case "draft":
    case "needs_fixes":
    case "rejected":
    case "expired":
    default:
      return {
        tone: "warning",
        text: "Αυτή είναι προεπισκόπηση. Η αγγελία δεν εμφανίζεται ακόμα δημόσια.",
      };
  }
}

export function canOpenPublicListingUrl(ownerStatusKey: OwnerListingStatusKey): boolean {
  return ownerStatusKey === "published" || ownerStatusKey === "paused";
}
