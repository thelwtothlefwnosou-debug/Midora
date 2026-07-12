import { ListingPublishPanel } from "@/components/dashboard/listing-workspace/ListingPublishPanel";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";
import { formatOwnerListingDate } from "@/lib/dashboard-listings";
import { getListingPublicId } from "@/lib/utils";

export default async function ListingPublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const { listing, ownerStatusKey, ownerStatusLabel } = ctx;
  const isFree = process.env.NEXT_PUBLIC_FREE_LISTINGS === "true";
  const publicId = getListingPublicId(listing);

  return (
    <ListingPublishPanel
      listingId={id}
      publicId={publicId}
      ownerStatusKey={ownerStatusKey}
      ownerStatusLabel={ownerStatusLabel}
      expiresLabel={formatOwnerListingDate(listing.expires_at)}
      publishedLabel={formatOwnerListingDate(listing.published_at)}
      isFree={isFree}
    />
  );
}
