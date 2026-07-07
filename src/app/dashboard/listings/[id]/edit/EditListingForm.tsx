"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingAvailabilityEditor } from "@/components/dashboard/ListingAvailabilityEditor";
import { ListingBedroomsEditor } from "@/components/dashboard/ListingBedroomsEditor";
import { ListingLocationEditor } from "@/components/dashboard/ListingLocationEditor";
import { ListingUnavailablePeriodsEditor } from "@/components/dashboard/ListingUnavailablePeriodsEditor";
import { ShortTermCalendarHub } from "@/components/dashboard/ShortTermCalendarHub";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { ListingCompletenessCard } from "@/components/dashboard/ListingCompletenessCard";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { updateListing } from "@/lib/actions";
import type { ListingPriceRule, ListingSleepingArrangement, ListingWithImages, Profile } from "@/lib/types";

type Props = {
  listing: ListingWithImages;
  profile: Profile;
  email: string;
  unavailablePeriods: ListingUnavailablePeriod[];
  priceRules: ListingPriceRule[];
  sleepingArrangements: ListingSleepingArrangement[];
};

export function EditListingForm({
  listing,
  profile,
  email,
  unavailablePeriods,
  priceRules,
  sleepingArrangements,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await updateListing(listing.id, formData)) ?? null;
    },
    null
  );

  const rentalType = listingRentalType(listing);
  const isShortTerm = rentalType === "short_term";
  const isMonthly = rentalType === "monthly";
  const photoCount = listing.listing_images?.length ?? 0;

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="listings"
      title="Επεξεργασία αγγελίας"
      subtitle="Μετά την αποθήκευση η αγγελία περνά ξανά έγκριση"
    >
      <div className="mb-4 flex items-start justify-end">
        <DeleteListingButton listingId={listing.id} />
      </div>

      {isShortTerm && (
        <div className="mb-6">
          <ListingCompletenessCard listing={listing} photoCount={photoCount} />
        </div>
      )}

      {isShortTerm && (
        <ShortTermCalendarHub
          listing={listing}
          periods={unavailablePeriods}
          priceRules={priceRules}
        />
      )}

      {isMonthly && (
        <ListingUnavailablePeriodsEditor
          listingId={listing.id}
          periods={unavailablePeriods}
          rentalType={rentalType}
        />
      )}

      {isShortTerm && (
        <ListingBedroomsEditor
          listing={listing}
          initialArrangements={sleepingArrangements}
        />
      )}

      <ListingLocationEditor listing={listing} />

      {isMonthly && (
        <GlassCard className="mb-6 p-6">
          <p className="mb-4 text-sm text-muted">
            Ενημέρωσε γρήγορα τη διαθεσιμότητα — δεν χρειάζεται επαν-έγκριση.
          </p>
          <ListingAvailabilityEditor
            listingId={listing.id}
            availabilityStatus={listing.availability_status}
            availabilityNote={listing.availability_note}
          />
        </GlassCard>
      )}

      <GlassCard className="p-6 sm:p-8">
        <ListingForm
          listing={listing}
          action={formAction}
          pending={pending}
          error={state?.error}
          submitLabel={pending ? "Αποθήκευση..." : "Αποθήκευση αλλαγών"}
        />
      </GlassCard>

      <p className="mt-4 text-center text-sm text-muted">
        <Link
          href={`/dashboard/listings/${listing.id}/photos`}
          className="text-gold hover:underline"
        >
          Διαχείριση φωτογραφιών →
        </Link>
      </p>
    </AccountShell>
  );
}
