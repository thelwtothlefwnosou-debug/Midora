import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasPermission,
  OWNER_FULL_PERMISSIONS,
  permissionFlagsForLevel,
  type CohostPermissionFlags,
  type ListingAccessPermission,
} from "@/lib/listing-cohost-permissions";
import type { ListingCohost } from "@/lib/types";

export type ListingAccessRole = "owner" | "cohost";

export type ListingAccessContext = {
  role: ListingAccessRole;
  listingId: string;
  ownerUserId: string;
  permissions: CohostPermissionFlags;
  cohostId: string | null;
  cohostRecord: ListingCohost | null;
};

export async function resolveListingAccess(
  supabase: SupabaseClient,
  listingId: string,
  userId: string
): Promise<ListingAccessContext | null> {
  const { data: cohost } = await supabase
    .from("listing_cohosts")
    .select("*")
    .eq("listing_id", listingId)
    .eq("cohost_user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (cohost) {
    return {
      role: "cohost",
      listingId,
      ownerUserId: cohost.owner_user_id,
      permissions: {
        can_manage_listing: cohost.can_manage_listing,
        can_manage_photos: cohost.can_manage_photos,
        can_manage_availability: cohost.can_manage_availability,
        can_manage_pricing: cohost.can_manage_pricing,
        can_manage_messages: cohost.can_manage_messages,
        can_view_stats: cohost.can_view_stats,
        can_manage_cohosts: cohost.can_manage_cohosts,
      },
      cohostId: cohost.id,
      cohostRecord: cohost as ListingCohost,
    };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.user_id !== userId) return null;

  return {
    role: "owner",
    listingId,
    ownerUserId: listing.user_id,
    permissions: OWNER_FULL_PERMISSIONS,
    cohostId: null,
    cohostRecord: null,
  };
}

export function accessAllows(
  access: ListingAccessContext,
  permission: ListingAccessPermission
): boolean {
  if (access.role === "owner") return true;
  if (permission === "owner_only") return false;
  return hasPermission(access.permissions, permission);
}

export function flagsFromCohostRow(
  row: Pick<
    ListingCohost,
    | "can_manage_listing"
    | "can_manage_photos"
    | "can_manage_availability"
    | "can_manage_pricing"
    | "can_manage_messages"
    | "can_view_stats"
    | "can_manage_cohosts"
  >
): CohostPermissionFlags {
  return {
    can_manage_listing: row.can_manage_listing,
    can_manage_photos: row.can_manage_photos,
    can_manage_availability: row.can_manage_availability,
    can_manage_pricing: row.can_manage_pricing,
    can_manage_messages: row.can_manage_messages,
    can_view_stats: row.can_view_stats,
    can_manage_cohosts: row.can_manage_cohosts,
  };
}

export { permissionFlagsForLevel };
