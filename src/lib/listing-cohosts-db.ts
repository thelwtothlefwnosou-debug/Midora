import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PUBLIC_COHOST_PROFILE_SELECT } from "@/lib/profile-contact-select";
import type { ListingCohost, ListingCohostWithProfile, ListingWithImages, Profile } from "@/lib/types";
import { MAX_COHOSTS_PER_LISTING } from "@/lib/listing-cohost-permissions";

export async function countActiveCohosts(
  listingId: string,
  ownerUserId: string
): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("listing_cohosts")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("owner_user_id", ownerUserId)
    .in("status", ["pending", "accepted"]);

  return count ?? 0;
}

export async function getListingCohostsForOwner(
  listingId: string,
  ownerUserId: string
): Promise<ListingCohostWithProfile[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_cohosts")
    .select("*")
    .eq("listing_id", listingId)
    .eq("owner_user_id", ownerUserId)
    .neq("status", "removed")
    .order("created_at", { ascending: true });

  if (error || !data?.length) return [];

  const userIds = data
    .map((r) => r.cohost_user_id)
    .filter((id): id is string => Boolean(id));

  let profiles: Profile[] = [];
  if (userIds.length) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select(
        "id, full_name, display_name, email, phone, avatar_path, show_profile_photo_public"
      )
      .in("id", userIds);
    profiles = (profileRows ?? []) as Profile[];
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return data.map((row) => ({
    ...(row as ListingCohost),
    profile: row.cohost_user_id ? profileMap.get(row.cohost_user_id) ?? null : null,
  }));
}

export async function getAcceptedPublicCohosts(
  listingId: string
): Promise<ListingCohostWithProfile[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_cohosts")
    .select("*")
    .eq("listing_id", listingId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: true });

  if (error || !data?.length) return [];

  const userIds = data
    .map((r) => r.cohost_user_id)
    .filter((id): id is string => Boolean(id));

  if (!userIds.length) return [];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select(PUBLIC_COHOST_PROFILE_SELECT)
    .in("id", userIds);

  const profileMap = new Map(
    ((profileRows ?? []) as Profile[]).map((p) => [p.id, p])
  );

  return data.map((row) => ({
    ...(row as ListingCohost),
    profile: row.cohost_user_id ? profileMap.get(row.cohost_user_id) ?? null : null,
  }));
}

export async function getCohostManagedListings(
  userId: string
): Promise<
  Array<{
    cohost: ListingCohost;
    listing: ListingWithImages;
    ownerProfile: Pick<Profile, "id" | "full_name" | "display_name"> | null;
  }>
> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: memberships, error } = await supabase
    .from("listing_cohosts")
    .select(
      "*, listings(id, title, area, city, area_display_name, city_display_name, user_id, listing_images(url, media_type, sort_order))"
    )
    .eq("cohost_user_id", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false });

  if (error || !memberships?.length) return [];

  const ownerIds = [
    ...new Set(
      memberships
        .map((m) => (m.listings as { user_id?: string } | null)?.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  let ownerProfiles: Pick<Profile, "id" | "full_name" | "display_name">[] = [];
  if (ownerIds.length) {
    const { data: rows } = await supabase
      .from("profiles")
      .select("id, full_name, display_name")
      .in("id", ownerIds);
    ownerProfiles = rows ?? [];
  }
  const ownerMap = new Map(ownerProfiles.map((p) => [p.id, p]));

  return memberships
    .filter((m) => m.listings)
    .map((m) => {
      const listing = m.listings as unknown as ListingWithImages;
      return {
        cohost: m as ListingCohost,
        listing,
        ownerProfile: ownerMap.get(listing.user_id) ?? null,
      };
    });
}

export async function getCohostInviteByToken(
  token: string
): Promise<(ListingCohost & { listing?: { title: string; user_id: string } }) | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("listing_cohosts")
    .select("*, listings(title, user_id)")
    .eq("invite_token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !data) return null;
  return data as ListingCohost & { listing?: { title: string; user_id: string } };
}

export function canInviteMoreCohosts(currentCount: number): boolean {
  return currentCount < MAX_COHOSTS_PER_LISTING;
}
