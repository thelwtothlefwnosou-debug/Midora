import { ListingWorkspaceLayoutGate } from "@/components/dashboard/listing-workspace/ListingWorkspaceLayoutGate";
import { requireDashboardContext } from "@/lib/dashboard-context";
import {
  loadListingWorkspace,
  loadAllAccessibleListingSwitcherItems,
} from "@/lib/listing-workspace-server";

export default async function ListingWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, email } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  let switcherItems: Awaited<ReturnType<typeof loadAllAccessibleListingSwitcherItems>> = [];
  try {
    switcherItems = await loadAllAccessibleListingSwitcherItems(profile.id);
  } catch {
    switcherItems = [];
  }

  return (
    <ListingWorkspaceLayoutGate
      listingId={id}
      profile={profile}
      email={email}
      ctx={ctx}
      switcherItems={switcherItems}
    >
      {children}
    </ListingWorkspaceLayoutGate>
  );
}
