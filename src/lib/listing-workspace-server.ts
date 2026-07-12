import "server-only";

import type { ListingWithImages } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingWorkspaceContext, ListingSwitcherItem } from "@/lib/listing-workspace-types";
import { resolveListingAccess } from "@/lib/listing-access";
import { OWNER_FULL_PERMISSIONS } from "@/lib/listing-cohost-permissions";

export async function loadListingWorkspace(
  listingId: string,
  userId: string
): Promise<ListingWorkspaceContext> {
  const supabase = await createClient();
  if (!supabase) notFound();

  const access = await resolveListingAccess(supabase, listingId, userId);
  if (!access) notFound();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("id", listingId)
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
    access,
    permissions:
      access.role === "owner" ? OWNER_FULL_PERMISSIONS : access.permissions,
  };
}

export async function loadOwnerListingSwitcherItems(
  userId: string
): Promise<ListingSwitcherItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      "id, title, area, area_display_name, city, city_display_name, status, is_hidden, expires_at, published_at, approval_status, admin_verification_notes, rental_type, listing_images(url, media_type, sort_order)"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !listings?.length) return [];

  return listings.map((listing) => mapSwitcherItem(listing as ListingWithImages, false));
}

export async function loadCohostListingSwitcherItems(
  userId: string
): Promise<ListingSwitcherItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: memberships, error } = await supabase
    .from("listing_cohosts")
    .select(
      "listing_id, listings(id, title, area, area_display_name, city, city_display_name, status, is_hidden, expires_at, published_at, approval_status, admin_verification_notes, rental_type, listing_images(url, media_type, sort_order))"
    )
    .eq("cohost_user_id", userId)
    .eq("status", "accepted");

  if (error || !memberships?.length) return [];

  return memberships
    .filter((m) => m.listings)
    .map((m) => mapSwitcherItem(m.listings as unknown as ListingWithImages, true));
}

function mapSwitcherItem(listing: ListingWithImages, isCohost: boolean): ListingSwitcherItem {
  const effectiveStatus = getEffectiveListingStatus(listing);
  const ownerStatus = getOwnerListingStatus(listing, effectiveStatus);
  const images = (listing.listing_images ?? []) as {
    url: string;
    media_type?: string;
    sort_order?: number;
  }[];
  const cover =
    images
      .filter((i) => i.media_type !== "video")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null;

  const location = [
    listing.area_display_name || listing.area,
    listing.city_display_name || listing.city,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: listing.id,
    title: listing.title,
    location,
    coverUrl: cover,
    statusKey: ownerStatus.key,
    statusLabel: ownerStatus.label,
    rentalType: listingRentalType(listing),
    isCohost,
  };
}

export async function loadAllAccessibleListingSwitcherItems(
  userId: string
): Promise<ListingSwitcherItem[]> {
  const [owned, cohosted] = await Promise.all([
    loadOwnerListingSwitcherItems(userId),
    loadCohostListingSwitcherItems(userId),
  ]);
  const ownedIds = new Set(owned.map((l) => l.id));
  return [...owned, ...cohosted.filter((l) => !ownedIds.has(l.id))];
}
