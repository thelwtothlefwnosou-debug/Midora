import { ListingOverviewPanel } from "@/components/dashboard/listing-workspace/ListingOverviewPanel";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerLeads } from "@/lib/leads";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

export default async function ListingWorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const allLeads = await getOwnerLeads(profile.id);
  const recentLeads = allLeads
    .filter((l) => l.listing_id === id && l.status !== "archived")
    .slice(0, 3);

  return <ListingOverviewPanel ctx={ctx} recentLeads={recentLeads} />;
}
