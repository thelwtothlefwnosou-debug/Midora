import { AccountShell } from "@/components/account/AccountShell";
import { DashboardListingsOverviewMetrics } from "@/components/dashboard/DashboardListingsOverviewMetrics";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { countNewOwnerLeads, getOwnerLeadStatsByListingIds } from "@/lib/leads";
import { attachStoredViewCounts } from "@/lib/listing-views-storage";
import {
  buildOwnerListingRowModel,
  buildOwnerListingsOverview,
} from "@/lib/owner-listings-page";

export default async function DashboardStatsPage() {
  const { profile, email } = await requireDashboardContext("/dashboard/stats");

  const listings = await attachStoredViewCounts(await getUserListings(profile.id));
  const listingIds = listings.map((l) => l.id);
  const [leadStatsMap, newInquiries] = await Promise.all([
    getOwnerLeadStatsByListingIds(profile.id, listingIds),
    countNewOwnerLeads(profile.id),
  ]);
  const rows = listings.map((listing) =>
    buildOwnerListingRowModel(
      listing,
      getEffectiveListingStatus(listing),
      leadStatsMap.get(listing.id) ?? { total: 0, last30Days: 0, unread: 0 }
    )
  );
  const overview = buildOwnerListingsOverview(rows, newInquiries);
  const hasPublished = overview.activeCount > 0;

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="listings"
      title="Στατιστικά"
      subtitle="Συνολική εικόνα από όλα τα ακίνητά σου."
    >
      {hasPublished ? (
        <DashboardListingsOverviewMetrics overview={overview} />
      ) : (
        <GlassCard className="px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold text-charcoal">
            Δεν υπάρχουν ακόμη στατιστικά
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Μόλις δημοσιευτεί τουλάχιστον μία αγγελία, θα εμφανίζονται εδώ προβολές και αιτήματα.
          </p>
        </GlassCard>
      )}
    </AccountShell>
  );
}
