import { AccountShell } from "@/components/account/AccountShell";
import { ListingWorkspaceHeader } from "@/components/dashboard/listing-workspace/ListingWorkspaceHeader";
import { ListingWorkspaceTabs } from "@/components/dashboard/listing-workspace/ListingWorkspaceTabs";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

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

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="listings"
      title={ctx.listing.title}
      subtitle="Διαχείριση ακινήτου — διαθεσιμότητα, τιμές και αιτήματα."
    >
      <ListingWorkspaceHeader ctx={ctx} />
      <ListingWorkspaceTabs listingId={id} />
      {children}
    </AccountShell>
  );
}
