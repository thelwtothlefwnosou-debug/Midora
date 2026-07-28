import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import { pickLocale } from "@/lib/locale-fallbacks";

export type ListingPreviewStatusMessage = {
  tone: "neutral" | "info" | "success" | "warning";
  text: string;
  textKey?: string;
};

type PreviewStatusT = (key: string) => string;

export function listingPreviewStatusMessage(
  ownerStatusKey: OwnerListingStatusKey,
  t?: PreviewStatusT,
  locale?: string
): ListingPreviewStatusMessage {
  switch (ownerStatusKey) {
    case "published":
    case "paused":
      return {
        tone: "success",
        textKey: "published",
        text: t
          ? t("published")
          : pickLocale(locale, "Η αγγελία εμφανίζεται δημόσια.", "This listing is visible publicly."),
      };
    case "review":
      return {
        tone: "info",
        textKey: "review",
        text: t
          ? t("review")
          : pickLocale(
              locale,
              "Η αγγελία είναι σε έλεγχο και θα εμφανιστεί δημόσια μετά την έγκριση.",
              "This listing is under review and will appear publicly after approval."
            ),
      };
    case "draft":
    case "needs_fixes":
    case "rejected":
    case "expired":
    default:
      return {
        tone: "warning",
        textKey: "previewOnly",
        text: t
          ? t("previewOnly")
          : pickLocale(
              locale,
              "Αυτή είναι προεπισκόπηση. Η αγγελία δεν εμφανίζεται ακόμα δημόσια.",
              "This is a preview. The listing is not public yet."
            ),
      };
  }
}

export function canOpenPublicListingUrl(ownerStatusKey: OwnerListingStatusKey): boolean {
  return ownerStatusKey === "published" || ownerStatusKey === "paused";
}
