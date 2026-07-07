import type { ListingWithImages } from "@/lib/types";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { MIN_LISTING_DESCRIPTION_LENGTH } from "@/lib/listing-wizard-validation";
import { listingSupportsShortTerm, listingRentalType, requiresAmaRegistry } from "@/lib/rental-types";

export type CompletenessItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
};

export function shortTermCompletenessItems(
  listing: ListingWithImages,
  photoCount: number
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
      label: "Βασικά στοιχεία",
      done: Boolean(listing.title?.trim() && listing.city && listing.area),
      required: true,
    },
    {
      id: "address",
      label: "Πλήρης ιδιωτική διεύθυνση",
      done: Boolean(listing.address_street?.trim() || listing.address?.trim()),
      required: true,
    },
    {
      id: "price",
      label: "Τιμή / βράδυ",
      done: Boolean(listing.price_per_night && listing.price_per_night > 0),
      required: true,
    },
    {
      id: "guests",
      label: "Μέγιστος αριθμός ατόμων",
      done: Boolean(listing.max_guests && listing.max_guests > 0),
      required: true,
    },
    {
      id: "min_stay",
      label: "Ελάχιστη διαμονή",
      done: Boolean(
        listing.minimum_stay_nights ||
          listing.min_stay_label?.includes("νύχτ")
      ),
      required: true,
    },
    {
      id: "photos",
      label: `${MIN_LISTING_PHOTOS_FOR_REVIEW}+ φωτογραφίες`,
      done: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
      required: true,
    },
    {
      id: "registry",
      label: "Αριθμός καταχώρισης",
      done: Boolean(listing.ama_number?.trim() && listing.legal_registry_type !== "none"),
      required: needsAma,
    },
    {
      id: "description",
      label: "Περιγραφή",
      done: (listing.description?.trim().length ?? 0) >= MIN_LISTING_DESCRIPTION_LENGTH,
      required: true,
    },
    {
      id: "availability",
      label: "Διαθεσιμότητα",
      done: Boolean(listing.availability_status),
      required: true,
    },
    {
      id: "declarations",
      label: "Υποχρεωτικές δηλώσεις",
      done: Boolean(
        listing.owner_responsibility_accepted &&
          listing.platform_role_accepted &&
          listing.terms_privacy_accepted &&
          (!needsAma || listing.ama_declaration_accepted)
      ),
      required: true,
    },
    {
      id: "amenities",
      label: "Παροχές",
      done: false,
      required: false,
    },
    {
      id: "house_rules",
      label: "Όροι διαμονής",
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
