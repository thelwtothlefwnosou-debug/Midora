import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";
import { pickLocale } from "@/lib/locale-fallbacks";

/** @deprecated Use `Owner.deleteListing.successToast` via next-intl in UI */
export const DELETE_LISTING_SUCCESS_TOAST = "Η αγγελία διαγράφηκε επιτυχώς";
/** @deprecated Use `Owner.deleteListing.errorToast` via next-intl in UI */
export const DELETE_LISTING_ERROR_TOAST =
  "Δεν ήταν δυνατή η διαγραφή της αγγελίας. Δοκίμασε ξανά.";

export function deleteListingSuccessToast(locale?: string): string {
  return pickLocale(
    locale,
    DELETE_LISTING_SUCCESS_TOAST,
    "Listing deleted successfully"
  );
}

export function deleteListingErrorToast(locale?: string): string {
  return pickLocale(
    locale,
    DELETE_LISTING_ERROR_TOAST,
    "Couldn't delete the listing. Please try again."
  );
}

export type DeleteListingNavIntent =
  | { kind: "local_remove" }
  | { kind: "navigate"; href: string }
  | { kind: "none" };

/**
 * After a successful listing delete, decide client navigation.
 * List pages pass onDeleted and must stay put (no overview redirect).
 * Detail/edit pages navigate back to the listings list (not /dashboard).
 */
export function resolveDeleteListingNavIntent(options: {
  hasOnDeleted: boolean;
  /** Explicit override; null means stay without local remove callback. */
  redirectTo?: string | null;
}): DeleteListingNavIntent {
  if (options.hasOnDeleted) return { kind: "local_remove" };
  if (options.redirectTo === null) return { kind: "none" };
  return {
    kind: "navigate",
    href: options.redirectTo ?? OWNER_LISTINGS_LIST_PATH,
  };
}
