import type { ListingWithImages } from "@/lib/types";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import {
  MIN_LISTING_DESCRIPTION_LENGTH,
  isListingDescriptionWithinMax,
} from "@/lib/listing-wizard-validation";
import { isPresentNumber } from "@/lib/listing-wizard-step-validation";
import { listingSupportsShortTerm, listingRentalType, requiresAmaRegistry } from "@/lib/rental-types";

export type CompletenessItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
};

export function shortTermCompletenessItems(
  listing: ListingWithImages,
  photoCount: number,
  amenityCount = 0
): CompletenessItem[] {
  const isShort = listingSupportsShortTerm(listing);
  if (!isShort) return [];

  const needsAma = requiresAmaRegistry(
    listingRentalType(listing),
    listing.accepts_under_60_days
  );

  return [
    {
      id: "basics",
      label: "basics",
      done: Boolean(listing.title?.trim() && listing.city && listing.area),
      required: true,
    },
    {
      id: "address",
      label: "address",
      done: Boolean(listing.address_street?.trim() || listing.address?.trim()),
      required: true,
    },
    {
      id: "price",
      label: "price",
      done: Boolean(listing.price_per_night && listing.price_per_night > 0),
      required: true,
    },
    {
      id: "guests",
      label: "guests",
      done: isPresentNumber(listing.max_guests) && (listing.max_guests as number) > 0,
      required: true,
    },
    {
      id: "min_stay",
      label: "min_stay",
      done: Boolean(
        listing.minimum_stay_nights ||
          listing.min_stay_label?.includes("νύχτ")
      ),
      required: true,
    },
    {
      id: "photos",
      label: "photos",
      done: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
      required: true,
    },
    {
      id: "registry",
      label: "registry",
      done: Boolean(listing.ama_number?.trim() && listing.legal_registry_type !== "none"),
      required: needsAma,
    },
    {
      id: "description",
      label: "description",
      done:
        (listing.description?.trim().length ?? 0) >= MIN_LISTING_DESCRIPTION_LENGTH &&
        isListingDescriptionWithinMax(listing.description ?? ""),
      required: true,
    },
    {
      id: "availability",
      label: "availability",
      done: Boolean(listing.availability_status),
      required: true,
    },
    {
      id: "declarations",
      label: "declarations",
      done: Boolean(
        listing.owner_responsibility_accepted &&
          listing.platform_role_accepted &&
          listing.terms_privacy_accepted &&
          (listing.tax_obligation_accepted === true ||
            Boolean(listing.declarations_submitted_at)) &&
          (listing.authority_disclosure_accepted === true ||
            Boolean(listing.declarations_submitted_at)) &&
          (!needsAma || listing.ama_declaration_accepted)
      ),
      required: true,
    },
    {
      id: "amenities",
      label: "amenities",
      done: amenityCount >= 5,
      required: false,
    },
    {
      id: "house_rules",
      label: "house_rules",
      done: false,
      required: false,
    },
  ];
}

export function completenessPercent(items: CompletenessItem[]): number {
  const required = items.filter((i) => i.required);
  if (!required.length) return 100;
  const done = required.filter((i) => i.done).length;
  return Math.round((done / required.length) * 100);
}

export function canSubmitShortTermReview(
  listing: ListingWithImages,
  photoCount: number
): { ok: boolean; missing: string[] } {
  const items = shortTermCompletenessItems(listing, photoCount);
  const missing = items.filter((i) => i.required && !i.done).map((i) => i.label);
  return { ok: missing.length === 0, missing };
}
