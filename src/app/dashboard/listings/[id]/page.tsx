import { ListingOverviewPanel } from "@/components/dashboard/listing-workspace/ListingOverviewPanel";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

export default async function ListingWorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);

  return <ListingOverviewPanel ctx={ctx} />;
}
