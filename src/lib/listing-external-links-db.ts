import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ListingExternalLink } from "@/lib/listing-external-links";
import {
  isStoredExternalLinkValid,
} from "@/lib/listing-external-links";

export async function getOwnerListingExternalLinks(
  listingId: string,
  ownerId: string
): Promise<ListingExternalLink[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: owned } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (!owned) return [];

  const { data, error } = await supabase
    .from("listing_external_links")
    .select("*")
    .eq("listing_id", listingId)
    .order("platform");

  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("Could not find")) {
      return [];
    }
    console.error("[listing_external_links] owner:", error.message);
    return [];
  }

  return (data ?? []) as ListingExternalLink[];
}

export async function getPublicListingExternalLinks(
  listingId: string
): Promise<ListingExternalLink[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_external_links")
    .select("*")
    .eq("listing_id", listingId)
    .eq("is_public", true)
    .order("platform");

  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("Could not find")) {
      return [];
    }
    console.error("[listing_external_links] public:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => isStoredExternalLinkValid(row as ListingExternalLink))
    .map((row) => row as ListingExternalLink);
}
