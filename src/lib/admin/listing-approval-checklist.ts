import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "@/lib/constants";
import { countSavedListingPhotos } from "@/lib/listing-image-db";
import { getAdminRegistryDisplay } from "@/lib/admin/registry-display";
import {
  listingRentalType,
  requiresAmaRegistry,
} from "@/lib/rental-types";
import type { Listing, ListingWithImages } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export type ApprovalChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
};

export type ListingApprovalChecklist = {
  canApprove: boolean;
  items: ApprovalChecklistItem[];
};

function hasPrivateAddress(listing: Listing): boolean {
  if (listing.address_street?.trim() && listing.address_number?.trim()) return true;
  return Boolean(listing.address?.trim());
}

export async function getListingApprovalChecklist(
  supabase: SupabaseClient,
  listing: ListingWithImages
): Promise<ListingApprovalChecklist> {
  const rentalType = listingRentalType(listing);
  const savedPhotos = await countSavedListingPhotos(supabase, listing.id);
  const localPhotos =
    listing.listing_images?.filter((img) => img.media_type !== "video").length ?? savedPhotos;
  const photoCount = Math.max(savedPhotos, localPhotos);

  const registry = getAdminRegistryDisplay(listing);
  const needsRegistry = requiresAmaRegistry(rentalType, listing.accepts_under_60_days);

  const declarationsOk = Boolean(
    listing.owner_responsibility_accepted &&
      listing.platform_role_accepted &&
      listing.terms_privacy_accepted &&
      (listing.tax_obligation_accepted === true ||
        Boolean(listing.declarations_submitted_at)) &&
      (listing.authority_disclosure_accepted === true ||
        Boolean(listing.declarations_submitted_at)) &&
      (!needsRegistry || listing.ama_declaration_accepted)
  );

  const items: ApprovalChecklistItem[] = [
    {
      id: "city_area",
      label: "Πόλη και περιοχή",
      ok: Boolean(listing.city?.trim() && listing.area?.trim()),
    },
    {
      id: "private_address",
      label: "Ιδιωτική διεύθυνση",
      ok: hasPrivateAddress(listing),
    },
    {
      id: "photos",
      label: `Αποθηκευμένες φωτογραφίες (≥${MIN_LISTING_PHOTOS_FOR_REVIEW})`,
      ok: photoCount >= MIN_LISTING_PHOTOS_FOR_REVIEW,
    },
    {
      id: "location",
      label: "Ακριβής τοποθεσία (pin + συντεταγμένες)",
      ok: Boolean(
        listing.latitude != null &&
          listing.longitude != null &&
          listing.location_confirmed_by_owner
      ),
    },
    {
      id: "declarations",
      label: "Δηλώσεις αγγελιοδότη",
      ok: declarationsOk,
    },
  ];

  if (rentalType === "short_term") {
    items.push(
      {
        id: "base_price",
        label: "Τιμή ανά βράδυ",
        ok: (listing.price_per_night ?? 0) > 0,
      },
      {
        id: "min_stay",
        label: "Ελάχιστη διαμονή",
        ok: Boolean(listing.min_stay_label?.trim() || (listing.min_months ?? 0) > 0),
      },
      {
        id: "registry",
        label: "Αριθμός καταχώρισης (ΑΜΑ/ΕΣΛ/ΜΑΓ)",
        ok: registry.kind === "value",
      }
    );
  } else {
    items.push(
      {
        id: "monthly_price",
        label: "Μηνιαία τιμή",
        ok: (listing.price_monthly ?? 0) > 0,
      },
      {
        id: "min_duration",
        label: "Ελάχιστη διάρκεια μίσθωσης",
        ok: Boolean(listing.min_stay_label?.trim() || (listing.min_months ?? 0) >= 1),
      }
    );

    if (needsRegistry) {
      items.push({
        id: "registry",
        label: "Αριθμός καταχώρισης (ΑΜΑ/ΕΣΛ/ΜΑΓ)",
        ok: registry.kind === "value",
      });
    }
  }

  return {
    canApprove: items.every((item) => item.ok),
    items,
  };
}

export function checklistBlockingMessage(checklist: ListingApprovalChecklist): string | null {
  if (checklist.canApprove) return null;
  const failed = checklist.items.filter((item) => !item.ok).map((item) => item.label);
  return `Δεν μπορεί να εγκριθεί ακόμα η αγγελία.\n${failed.map((l) => `• ${l}`).join("\n")}`;
}
