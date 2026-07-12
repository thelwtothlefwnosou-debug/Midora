import { notFound } from "next/navigation";
import { ListingCohostsPanel } from "@/components/dashboard/listing-workspace/ListingCohostsPanel";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { canInviteMoreCohosts, countActiveCohosts, getListingCohostsForOwner } from "@/lib/listing-cohosts-db";
import { getListingContactNumbers } from "@/lib/listing-contact-numbers-db";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

export default async function ListingCohostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);

  if (ctx.access.role !== "owner") {
    notFound();
  }

  const [cohosts, contactNumbers, activeCount] = await Promise.all([
    getListingCohostsForOwner(id, profile.id),
    getListingContactNumbers(id),
    countActiveCohosts(id, profile.id),
  ]);

  return (
    <ListingCohostsPanel
      listingId={id}
      cohosts={cohosts}
      contactNumbers={contactNumbers}
      isOwner
      canInvite={canInviteMoreCohosts(activeCount)}
    />
  );
}
