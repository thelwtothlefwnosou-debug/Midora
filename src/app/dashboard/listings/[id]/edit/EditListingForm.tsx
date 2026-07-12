"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingBedroomsEditor } from "@/components/dashboard/ListingBedroomsEditor";
import { ListingAmenitiesEditor } from "@/components/dashboard/ListingAmenitiesEditor";
import { ListingLocationEditor } from "@/components/dashboard/ListingLocationEditor";
import { ListingExternalLinksEditor } from "@/components/dashboard/ListingExternalLinksEditor";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { updateListing } from "@/lib/actions";
import type {
  ListingAmenityRow,
  ListingPriceRule,
  ListingSleepingArrangement,
  ListingWithImages,
  Profile,
} from "@/lib/types";
import type { ListingExternalLink } from "@/lib/listing-external-links";

type Props = {
  listing: ListingWithImages;
  profile: Profile;
  email: string;
  unavailablePeriods: ListingUnavailablePeriod[];
  priceRules: ListingPriceRule[];
  sleepingArrangements: ListingSleepingArrangement[];
  externalLinks: ListingExternalLink[];
  amenities: ListingAmenityRow[];
};

export function EditListingForm({
  listing,
  sleepingArrangements,
  externalLinks,
  amenities,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const result = await updateListing(listing.id, formData);
      if (result && "error" in result && result.error) {
        return { error: result.error };
      }
      return { saved: true };
    },
    null
  );

  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const photoCount = listing.listing_images?.length ?? 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-charcoal">Επεξεργασία αγγελίας</h2>
          <p className="mt-1 text-sm text-muted">
            Οι αλλαγές σε βασικά στοιχεία, περιγραφή και τοποθεσία μπορεί να χρειάζονται επανέλεγχο.
          </p>
        </div>
        <DeleteListingButton listingId={listing.id} />
      </div>

      {state?.saved && (
        <p className="mb-4 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          Οι αλλαγές αποθηκεύτηκαν.
        </p>
      )}
      {state?.error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {isShortTerm && (
        <div className="mb-6">
          <ListingCompletenessCard
            listing={listing}
            photoCount={photoCount}
            amenityCount={amenities.length}
          />
        </div>
      )}

      {isShortTerm && (
        <ListingBedroomsEditor
          listing={listing}
          initialArrangements={sleepingArrangements}
        />
      )}

      <ListingAmenitiesEditor listing={listing} initialAmenities={amenities} />

      <ListingLocationEditor listing={listing} />

      <ListingExternalLinksEditor listingId={listing.id} initialLinks={externalLinks} />

      <GlassCard className="mt-6 p-6 sm:p-8">
        <ListingForm
          listing={listing}
          action={formAction}
          pending={pending}
          error={state?.error}
          submitLabel={pending ? "Αποθήκευση…" : "Αποθήκευση αλλαγών"}
        />
      </GlassCard>

      <p className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
        <Link
          href={`/dashboard/listings/${listing.id}/photos`}
          className="font-medium text-gold-dark hover:underline"
        >
          Διαχείριση φωτογραφιών →
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/availability`}
          className="font-medium text-gold-dark hover:underline"
        >
          Διαθεσιμότητα →
        </Link>
      </p>
    </div>
  );
}
