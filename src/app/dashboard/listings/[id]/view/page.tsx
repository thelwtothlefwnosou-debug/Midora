import { ListingOwnerPreviewBody } from "@/components/dashboard/listing-preview/ListingOwnerPreviewBody";
import { ListingPreviewPageClient } from "@/components/dashboard/listing-preview/ListingPreviewPageClient";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";
import { requireOwnerListingPublicPreview } from "@/lib/listing-owner-preview";
import {
  canOpenPublicListingUrl,
  listingPreviewStatusMessage,
} from "@/lib/listing-preview-status";
import { getListingPublicId } from "@/lib/utils";
import { getPublicUnavailablePeriods } from "@/lib/unavailable-periods-db";
import { getNearbyListings } from "@/lib/nearby-listings";
import { defaultPublicRentalMode } from "@/lib/listing-rental-modes";

export default async function ListingOwnerViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { id } = await params;
  const { embed } = await searchParams;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  const ctx = await loadListingWorkspace(id, profile.id);
  const listing = await requireOwnerListingPublicPreview(id, profile.id);
  const unavailablePeriods = await getPublicUnavailablePeriods(listing.id);
  const nearby = await getNearbyListings(listing, {
    rentalMode: defaultPublicRentalMode(listing),
  });

  const status = listingPreviewStatusMessage(ctx.ownerStatusKey);
  const publicId = getListingPublicId(listing);
  const publicHref = `/listings/${publicId}`;
  const showPublicLink = canOpenPublicListingUrl(ctx.ownerStatusKey);

  if (embed === "mobile") {
    return (
      <ListingOwnerPreviewBody
        listing={listing}
        unavailablePeriods={unavailablePeriods}
        nearby={nearby}
        embed
      />
    );
  }

  return (
    <ListingPreviewPageClient
      listingId={id}
      status={status}
      showPublicLink={showPublicLink}
      publicHref={publicHref}
      desktop={
        <ListingOwnerPreviewBody
          listing={listing}
          unavailablePeriods={unavailablePeriods}
          nearby={nearby}
        />
      }
    />
  );
}
