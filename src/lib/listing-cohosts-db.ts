import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

  const profileClient = createServiceClient() ?? supabase;
  const { data: profileRows } = await profileClient
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
    .select("*")
    .eq("cohost_user_id", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false });

  if (error || !memberships?.length) return [];

  const listingIds = memberships
    .map((m) => m.listing_id)
    .filter((id): id is string => Boolean(id));
  if (!listingIds.length) return [];

  const listingSelect =
    "id, slug, title, area, city, area_display_name, city_display_name, user_id";

  async function loadListingRows(
    client: NonNullable<ReturnType<typeof createServiceClient>> | Awaited<ReturnType<typeof createClient>>
  ) {
    const { data, error } = await client!
      .from("listings")
      .select(listingSelect)
      .in("id", listingIds);
    if (error || !data?.length) return null;
    return data as ListingWithImages[];
  }

  let listingRows = await loadListingRows(supabase);
  if (!listingRows?.length) {
    const service = createServiceClient();
    if (service) listingRows = await loadListingRows(service);
  }
  if (!listingRows?.length) return [];

  const service = createServiceClient() ?? supabase;
  const { data: imageRows } = await service
    .from("listing_images")
    .select("listing_id, url, is_cover, media_type, sort_order")
    .in("listing_id", listingIds);

  const imagesByListing = new Map<string, ListingWithImages["listing_images"]>();
  for (const row of imageRows ?? []) {
    const listingId = row.listing_id as string;
    const bucket = imagesByListing.get(listingId) ?? [];
    bucket.push({
      url: row.url as string,
      is_cover: Boolean(row.is_cover),
      media_type: ((row.media_type as "image" | "video") ?? "image") as "image" | "video",
      sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    } as ListingWithImages["listing_images"][number]);
    imagesByListing.set(listingId, bucket);
  }

  listingRows = listingRows.map((listing) => ({
    ...listing,
    listing_images: imagesByListing.get(listing.id) ?? [],
  }));

  const listingMap = new Map(
    (listingRows as ListingWithImages[]).map((listing) => [listing.id, listing])
  );

  const ownerIds = [
    ...new Set(
      listingRows
        .map((l) => l.user_id)
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
    .map((m) => {
      const listing = listingMap.get(m.listing_id);
      if (!listing) return null;
      return {
        cohost: m as ListingCohost,
        listing,
        ownerProfile: ownerMap.get(listing.user_id) ?? null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
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
