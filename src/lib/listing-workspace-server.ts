import "server-only";

import type { ListingWithImages } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import { getEffectiveListingStatus } from "@/lib/listing-status";
import { getOwnerListingStatus } from "@/lib/dashboard-listings";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingWorkspaceContext, ListingSwitcherItem } from "@/lib/listing-workspace-types";
import { resolveListingAccess, type ListingAccessContext } from "@/lib/listing-access";
import { OWNER_FULL_PERMISSIONS } from "@/lib/listing-cohost-permissions";

const LISTING_WORKSPACE_SELECT = "*, listing_images(*)" as const;

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function resolveWorkspaceListingId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  idOrSlug: string
): Promise<string | null> {
  const trimmed = idOrSlug.trim();
  if (!trimmed) return null;

  if (isUuidLike(trimmed)) return trimmed;

  const { data } = await supabase
    .from("listings")
    .select("id")
    .eq("slug", trimmed)
    .maybeSingle();

  return data?.id ?? null;
}

async function fetchListingForWorkspace(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  listingId: string,
  access: ListingAccessContext
): Promise<ListingWithImages | null> {
  const userResult = await supabase
    .from("listings")
    .select(LISTING_WORKSPACE_SELECT)
    .eq("id", listingId)
    .maybeSingle();

  if (!userResult.error && userResult.data) {
    return userResult.data as ListingWithImages;
  }

  if (access.role !== "cohost") return null;

  const service = createServiceClient();
  if (!service) return null;

  const serviceResult = await service
    .from("listings")
    .select(LISTING_WORKSPACE_SELECT)
    .eq("id", listingId)
    .maybeSingle();

  if (serviceResult.error || !serviceResult.data) return null;
  return serviceResult.data as ListingWithImages;
}

export async function loadListingWorkspace(
  listingId: string,
  userId: string
): Promise<ListingWorkspaceContext> {
  const supabase = await createClient();
  if (!supabase) notFound();

  const resolvedListingId = await resolveWorkspaceListingId(supabase, listingId);
  if (!resolvedListingId) notFound();

  const access = await resolveListingAccess(supabase, resolvedListingId, userId);
  if (!access) notFound();

  const listing = await fetchListingForWorkspace(supabase, resolvedListingId, access);
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
    .select("listing_id")
    .eq("cohost_user_id", userId)
    .eq("status", "accepted");

  if (error || !memberships?.length) return [];

  const listingIds = memberships.map((m) => m.listing_id).filter(Boolean);
  if (!listingIds.length) return [];

  const select =
    "id, title, area, area_display_name, city, city_display_name, status, is_hidden, expires_at, published_at, approval_status, admin_verification_notes, rental_type";

  let listingRows: ListingWithImages[] | null = null;
  const userResult = await supabase.from("listings").select(select).in("id", listingIds);
  if (!userResult.error && userResult.data?.length) {
    listingRows = userResult.data as ListingWithImages[];
  }

  if (!listingRows?.length) {
    const service = createServiceClient();
    if (service) {
      const serviceResult = await service.from("listings").select(select).in("id", listingIds);
      if (!serviceResult.error && serviceResult.data?.length) {
        listingRows = serviceResult.data as ListingWithImages[];
      }
    }
  }

  if (!listingRows?.length) return [];

  const imageClient = createServiceClient() ?? supabase;
  const { data: imageRows } = await imageClient
    .from("listing_images")
    .select("listing_id, url, media_type, sort_order")
    .in("listing_id", listingIds);

  const imagesByListing = new Map<string, ListingWithImages["listing_images"]>();
  for (const row of imageRows ?? []) {
    const listingId = row.listing_id as string;
    const bucket = imagesByListing.get(listingId) ?? [];
    bucket.push({
      url: row.url as string,
      media_type: ((row.media_type as "image" | "video") ?? "image") as "image" | "video",
      sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    } as ListingWithImages["listing_images"][number]);
    imagesByListing.set(listingId, bucket);
  }

  return listingRows.map((listing) =>
    mapSwitcherItem(
      { ...listing, listing_images: imagesByListing.get(listing.id) ?? [] },
      true
    )
  );
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
