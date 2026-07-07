import {
  formatAmaDisplay,
  listingRentalType,
  requiresAmaRegistry,
} from "@/lib/rental-types";
import type { Listing } from "@/lib/types";

export type AdminRegistryDisplayKind =
  | "value"
  | "not_required"
  | "missing"
  | "required_missing";

export type AdminRegistryDisplay = {
  kind: AdminRegistryDisplayKind;
  text: string;
};

export function getAdminRegistryDisplay(
  listing: Pick<
    Listing,
    "rental_type" | "accepts_under_60_days" | "ama_number" | "legal_registry_type"
  >
): AdminRegistryDisplay {
  const rentalType = listingRentalType(listing);
  const needsRegistry = requiresAmaRegistry(rentalType, listing.accepts_under_60_days);
  const formatted = formatAmaDisplay(listing);

  if (!needsRegistry) {
    return { kind: "not_required", text: "Δεν απαιτείται" };
  }

  if (formatted) {
    return { kind: "value", text: formatted };
  }

  if (rentalType === "short_term") {
    return { kind: "missing", text: "Λείπει αριθμός καταχώρισης" };
  }

  if (listing.accepts_under_60_days) {
    return { kind: "required_missing", text: "Απαιτείται αριθμός καταχώρισης" };
  }

  return { kind: "not_required", text: "Δεν απαιτείται" };
}
