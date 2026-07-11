import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ListingPublicDetail } from "@/lib/types";
import { getListingPublicDetail } from "@/lib/listing-detail-queries";
import { notFound } from "next/navigation";

/** Owner-only public listing data for preview (saved backend state). */
export async function getOwnerListingPublicPreview(
  listingId: string,
  ownerId: string
): Promise<ListingPublicDetail | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: owned } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (!owned) return null;

  return getListingPublicDetail(listingId);
}

export async function requireOwnerListingPublicPreview(
  listingId: string,
  ownerId: string
): Promise<ListingPublicDetail> {
  const listing = await getOwnerListingPublicPreview(listingId, ownerId);
  if (!listing) notFound();
  return listing;
}


