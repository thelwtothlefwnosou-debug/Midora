import "server-only";

import type { ListingWithImages } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingWorkspaceContext } from "@/lib/listing-workspace-types";

export async function loadListingWorkspace(
  listingId: string,
  userId: string
): Promise<ListingWorkspaceContext> {
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (!listing) notFound();

  const effectiveStatus = getEffectiveListingStatus(listing);
  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const photoCount =
    listing.listing_images?.filter((i: { media_type?: string }) => i.media_type !== "video")
      .length ?? 0;

  return {
    listing: listing as ListingWithImages,
    effectiveStatus,
    ownerStatusKey: ownerStatus.key,
    ownerStatusLabel: ownerStatus.label,
    rentalType: listingRentalType(listing),
    photoCount,
  };
}
