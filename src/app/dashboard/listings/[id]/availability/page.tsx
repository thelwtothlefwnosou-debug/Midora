import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";
import { getOwnerUnavailablePeriods } from "@/lib/unavailable-periods-db";
import { getListingPriceRules } from "@/lib/listing-price-rules";
import { ListingAvailabilityEditor } from "@/components/dashboard/ListingAvailabilityEditor";
import { ListingUnavailablePeriodsEditor } from "@/components/dashboard/ListingUnavailablePeriodsEditor";
import { ShortTermCalendarHub } from "@/components/dashboard/ShortTermCalendarHub";
import { GlassCard } from "@/components/ui/GlassCard";

export default async function ListingAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const { listing, rentalType } = ctx;
  const isShortTerm = rentalType === "short_term";

  const unavailablePeriods = await getOwnerUnavailablePeriods(id, profile.id);
  const priceRulesResult = await getListingPriceRules(id);
  const priceRules = "rules" in priceRulesResult ? priceRulesResult.rules ?? [] : [];

  if (isShortTerm) {
    return (
      <div>
        <h2 className="mb-1 font-display text-lg font-semibold text-charcoal">Διαθεσιμότητα</h2>
        <p className="mb-5 text-sm text-muted">
          Ορίσε τιμές ανά ημέρα, κλείσε ημερομηνίες και δες πώς θα εμφανίζεται στον ενδιαφερόμενο.
          Ενδεικτική διαθεσιμότητα — χωρίς κράτηση ή πληρωμή.
        </p>
        <ShortTermCalendarHub
          listing={listing}
          periods={unavailablePeriods}
          priceRules={priceRules}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-semibold text-charcoal">
        Διαθεσιμότητα και όροι μίσθωσης
      </h2>
      <p className="mb-5 text-sm text-muted">
        Διαχειρίσου την κατάσταση, τους όρους και τις περιόδους διαθεσιμότητας για μηνιαία
        μίσθωση.
      </p>
      <ListingUnavailablePeriodsEditor
        listingId={listing.id}
        periods={unavailablePeriods}
        rentalType={rentalType}
      />
      <GlassCard className="mt-6 p-6">
        <p className="mb-4 text-sm text-muted">
          Γρήγορη ενημέρωση κατάστασης διαθεσιμότητας — δεν χρειάζεται επαν-έγκριση.
        </p>
        <ListingAvailabilityEditor
          listingId={listing.id}
          availabilityStatus={listing.availability_status}
          availabilityNote={listing.availability_note}
        />
      </GlassCard>
    </div>
  );
}
