import { AccountShell } from "@/components/account/AccountShell";
import { CohostManagedListingsSection } from "@/components/dashboard/CohostManagedListingsSection";
import { DashboardListingsView } from "@/components/dashboard/DashboardListingsView";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getUserListings } from "@/lib/listings";
import { getCohostManagedListings } from "@/lib/listing-cohosts-db";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { countNewOwnerLeads, getOwnerLeadStatsByListingIds } from "@/lib/leads";
import { attachStoredViewCounts } from "@/lib/listing-views-storage";
import { buildOwnerListingRowModel } from "@/lib/owner-listings-page";
import type { ListingFilterTab } from "@/lib/owner-listings-page";

function mapLegacyStatusFilter(status?: string): ListingFilterTab {
  if (status === "active") return "published";
  if (status === "pending") return "review";
  if (status === "draft") return "draft";
  return "all";
}

export default async function DashboardListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    submitted?: string;
    saved?: string;
    draftSaved?: string;
    status?: string;
  }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/listings");
  const { submitted, saved, draftSaved, status: statusFilter } = await searchParams;
  const [allListings, cohostItems] = await Promise.all([
    attachStoredViewCounts(await getUserListings(profile.id)),
    getCohostManagedListings(profile.id),
  ]);
  const isCohostOnly = allListings.length === 0 && cohostItems.length > 0;
  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";
  const listingIds = allListings.map((l) => l.id);
  const [leadStats, newInquiries] = await Promise.all([
    getOwnerLeadStatsByListingIds(profile.id, listingIds),
    countNewOwnerLeads(profile.id),
  ]);

  const rows = allListings.map((listing) => {
    const effectiveStatus = getEffectiveListingStatus(listing);
    return buildOwnerListingRowModel(
      listing,
      effectiveStatus,
      leadStats.get(listing.id) ?? { total: 0, last30Days: 0, unread: 0 }
    );
  });

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="listings"
      title="Τα ακίνητά μου"
      subtitle="Διαχειρίσου την προβολή, την κατάσταση και τα αιτήματα για κάθε ακίνητο."
    >
      {submitted === "review" && (
        <div className="mb-5 rounded-xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm text-charcoal">
          Η αγγελία υποβλήθηκε για έλεγχο. Θα ενημερωθείς όταν ολοκληρωθεί ο βασικός έλεγχο.
        </div>
      )}
      {(draftSaved === "1" || saved === "draft") && (
        <div className="mb-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal">
          Η αγγελία αποθηκεύτηκε ως πρόχειρο.
        </div>
      )}

      {isCohostOnly && (
        <CohostManagedListingsSection
          userId={profile.id}
          items={cohostItems}
          prominent
        />
      )}

      <DashboardListingsView
        rows={rows}
        newInquiries={newInquiries}
        isFree={isFree}
        initialTab={mapLegacyStatusFilter(statusFilter)}
        cohostManagedCount={cohostItems.length}
      />

      {!isCohostOnly && (
        <CohostManagedListingsSection userId={profile.id} items={cohostItems} />
      )}
    </AccountShell>
  );
}
