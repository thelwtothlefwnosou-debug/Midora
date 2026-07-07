import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { getAdminRegistryDisplay } from "@/lib/admin/registry-display";
import { listingRentalType, requiresAmaRegistry } from "@/lib/rental-types";
import { MIN_LISTING_DESCRIPTION_LENGTH } from "@/lib/listing-wizard-validation";
import type { ListingWithImages } from "@/lib/types";

export type CompletenessItem = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
};

export type ListingCompleteness = {
  score: number;
  total: number;
  items: CompletenessItem[];
  missingLabels: string[];
};

function hasPrivateAddress(listing: ListingWithImages): boolean {
  if (listing.address_street?.trim() && listing.address_number?.trim()) return true;
  return Boolean(listing.address?.trim());
}

export function getListingCompleteness(listing: ListingWithImages): ListingCompleteness {
  const rentalType = listingRentalType(listing);
  const photoCount =
    listing.listing_images?.filter((img) => img.media_type !== "video").length ?? 0;
  const registry = getAdminRegistryDisplay(listing);
  const needsRegistry = requiresAmaRegistry(rentalType, listing.accepts_under_60_days);

  const items: CompletenessItem[] = [
    {
      id: "photos",
      label: "Φωτογραφίες",
      ok: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
      detail: `${photoCount}/${MIN_LISTING_PHOTOS_FOR_REVIEW}`,
    },
    {
      id: "address",
      label: "Διεύθυνση",
      ok: hasPrivateAddress(listing),
      detail: hasPrivateAddress(listing) ? "Ολοκληρωμένη" : "Ελλιπής",
    },
    {
      id: "map",
      label: "Χάρτης",
      ok: Boolean(
        listing.latitude != null &&
          listing.longitude != null &&
          listing.location_confirmed_by_owner
      ),
      detail: listing.location_confirmed_by_owner ? "Επιβεβαιωμένος" : "Χρειάζεται έλεγχο",
    },
    {
      id: "title",
      label: "Τίτλος και περιγραφή",
      ok: Boolean(
        listing.title?.trim().length >= 10 &&
          listing.description?.trim().length >= MIN_LISTING_DESCRIPTION_LENGTH
      ),
    },
    {
      id: "price",
      label: "Τιμή",
      ok:
        rentalType === "short_term"
          ? (listing.price_per_night ?? 0) > 0
          : (listing.price_monthly ?? 0) > 0,
    },
    {
      id: "phone",
      label: "Τηλέφωνο",
      ok: Boolean(listing.contact_phone?.trim()),
    },
    {
      id: "declarations",
      label: "Δηλώσεις",
      ok: Boolean(
        listing.owner_responsibility_accepted &&
          listing.platform_role_accepted &&
          listing.terms_privacy_accepted &&
          (!needsRegistry || listing.ama_declaration_accepted)
      ),
    },
  ];

  if (needsRegistry) {
    items.push({
      id: "registry",
      label: "ΑΜΑ / ΕΣΛ / ΜΑΓ",
      ok: registry.kind === "value",
      detail:
        registry.kind === "value"
          ? "Συμπληρώθηκε"
          : registry.kind === "missing"
            ? "Λείπει"
            : "Χρειάζεται έλεγχο",
    });
  }

  const missingLabels = items.filter((i) => !i.ok).map((i) => i.label);
  const okCount = items.filter((i) => i.ok).length;

  return {
    score: okCount,
    total: items.length,
    items,
    missingLabels,
  };
}
