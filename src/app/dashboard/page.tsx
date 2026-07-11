import { GlassCard } from "@/components/ui/GlassCard";
import { AccountShell } from "@/components/account/AccountShell";
import { OwnerHomeOverview } from "@/components/dashboard/OwnerHomeOverview";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { countNewOwnerLeads, getOwnerLeadStatsByListingIds, getOwnerLeads } from "@/lib/leads";
import { attachStoredViewCounts } from "@/lib/listing-views-storage";
import {
  buildOwnerListingRowModel,
  buildOwnerListingsOverview,
} from "@/lib/owner-listings-page";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const { profile, email } = await requireDashboardContext("/dashboard");

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
  const leads = await getOwnerLeads(profile.id);
  const recentLeads = leads.filter((l) => l.status !== "archived").slice(0, 3);

  const firstName = profile.full_name?.split(" ")[0] ?? "φίλε";

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="overview"
      title={`Καλησπέρα, ${firstName}`}
      subtitle="Δες τι συμβαίνει με τα ακίνητά σου."
    >
      {params.submitted && (
        <GlassCard className="mb-6 border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-teal">
            Η αγγελία υποβλήθηκε για έλεγχο. Θα ενημερωθείς όταν ολοκληρωθεί η διαδικασία.
          </p>
        </GlassCard>
      )}

      {params.updated && (
        <GlassCard className="mb-6 border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-teal">Οι αλλαγές αποθηκεύτηκαν.</p>
        </GlassCard>
      )}

      <OwnerHomeOverview
        profile={profile}
        email={email}
        rows={rows}
        overview={overview}
        recentLeads={recentLeads}
      />
    </AccountShell>
  );
}
