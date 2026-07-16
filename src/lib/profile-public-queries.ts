import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { isListingActive } from "@/lib/listings";
import { isPublicMvpListing } from "@/lib/rental-types";
import { canShowPublicAvatar, resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { profileDisplayName } from "@/lib/profile-display";
import { isUuidLike } from "@/lib/profile-slug";
import type { ListingWithImages, Profile } from "@/lib/types";

export const PUBLIC_PROFILE_SELECT =
  "id, full_name, display_name, bio, advertiser_type, business_name, business_title, communication_languages, created_at, primary_phone_verified_at, avatar_path, avatar_status, show_profile_photo_public, public_slug, public_profile_enabled, show_owned_listings_on_profile, show_cohosted_listings_on_profile" as const;

const PUBLIC_PROFILE_SELECT_MINIMAL =
  "id, full_name, display_name, bio, created_at, public_slug, public_profile_enabled, show_owned_listings_on_profile, show_cohosted_listings_on_profile" as const;

function isMissingProfileColumn(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("does not exist") ||
    msg.includes("Could not find") ||
    msg.includes("account_status") ||
    msg.includes("primary_phone_verified_at") ||
    msg.includes("avatar_status") ||
    msg.includes("show_profile_photo_public") ||
    msg.includes("advertiser_type") ||
    msg.includes("communication_languages")
  );
}

export type PublicProfileRecord = Pick<
  Profile,
  | "id"
  | "full_name"
  | "display_name"
  | "bio"
  | "advertiser_type"
  | "business_name"
  | "business_title"
  | "communication_languages"
  | "created_at"
  | "primary_phone_verified_at"
  | "avatar_path"
  | "avatar_status"
  | "show_profile_photo_public"
> & {
  public_slug?: string | null;
  public_profile_enabled?: boolean | null;
  show_owned_listings_on_profile?: boolean | null;
  show_cohosted_listings_on_profile?: boolean | null;
  account_status?: Profile["account_status"];
};

export type PublicProfileListingRole = "owner" | "cohost";

export type PublicProfileListingCardRow = {
  id: string;
  slug: string | null;
  title: string;
  area: string;
  city: string;
  area_display_name: string | null;
  city_display_name: string | null;
  rental_type: ListingWithImages["rental_type"];
  price_type: ListingWithImages["price_type"];
  price_per_night: number | null;
  price_monthly: number | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqm: number | null;
  max_guests: number | null;
  min_stay_nights: number | null;
  min_months: number | null;
  status: ListingWithImages["status"];
  is_hidden: boolean | null;
  expires_at: string | null;
  included_guests: number | null;
  extra_guest_fee_per_night: number | null;
  weekend_price_per_night: number | null;
  weekend_days: number[] | null;
  weekly_discount_percent: number | null;
  monthly_discount_percent: number | null;
  user_id: string;
  listing_images: ListingWithImages["listing_images"];
};

export type PublicProfileListingItem = PublicProfileListingCardRow & {
  profileRole: PublicProfileListingRole;
};

export type PublicProfilePageData = {
  profile: PublicProfileRecord;
  displayName: string;
  avatarUrl: string | null;
  phoneVerified: boolean;
  roleLabel: string;
  ownedListings: PublicProfileListingItem[];
  cohostedListings: PublicProfileListingItem[];
  activeListingsCount: number;
};

const LISTING_CARD_SELECT_MINIMAL =
  "id, slug, title, area, city, rental_type, price_per_night, status, is_hidden, expires_at, user_id";

async function attachPublicProfileListingImages(
  supabase: SupabaseClient,
  rows: PublicProfileListingCardRow[]
): Promise<PublicProfileListingCardRow[]> {
  if (!rows.length) return rows;

  const ids = rows.map((row) => row.id);
  const { data: imageRows, error } = await supabase
    .from("listing_images")
    .select("listing_id, url, is_cover, media_type, sort_order")
    .in("listing_id", ids);

  if (error) {
    console.error("[public-profile] listing_images failed:", error.message);
    return rows.map((row) => ({ ...row, listing_images: row.listing_images ?? [] }));
  }

  const imagesByListing = new Map<
    string,
    Pick<ListingWithImages["listing_images"][number], "url" | "is_cover" | "media_type" | "sort_order">[]
  >();
  for (const row of imageRows ?? []) {
    const listingId = row.listing_id as string;
    const bucket = imagesByListing.get(listingId) ?? [];
    bucket.push({
      url: row.url as string,
      is_cover: Boolean(row.is_cover),
      media_type: ((row.media_type as "image" | "video") ?? "image") as "image" | "video",
      sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    });
    imagesByListing.set(listingId, bucket);
  }

  return rows.map((row) => ({
    ...row,
    listing_images: (imagesByListing.get(row.id) ?? []) as ListingWithImages["listing_images"],
  }));
}

/** Public profile reads bypass RLS when service role is available. */
function getPublicProfileReadClient(): SupabaseClient | null {
  const service = createServiceClient();
  if (service) return service;

  if (!isSupabaseConfigured()) return null;

  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchPublicProfileRow(
  supabase: SupabaseClient,
  slugOrId: string
): Promise<PublicProfileRecord | null> {
  const trimmed = slugOrId.trim();
  if (!trimmed) return null;

  const filters = (select: string) => {
    let query = supabase.from("profiles").select(select);
    if (isUuidLike(trimmed)) {
      query = query.eq("id", trimmed);
    } else {
      query = query.eq("public_slug", trimmed.toLowerCase());
    }
    return query.maybeSingle();
  };

  let result = await filters(PUBLIC_PROFILE_SELECT);
  if (result.error && isMissingProfileColumn(result.error)) {
    result = await filters(PUBLIC_PROFILE_SELECT_MINIMAL);
  }

  if (result.error) {
    console.error("[public-profile] lookup failed:", result.error.message);
    return null;
  }

  return (result.data as PublicProfileRecord | null) ?? null;
}

function isPublicListingRow(listing: PublicProfileListingCardRow): boolean {
  const row = listing as unknown as ListingWithImages;
  return isListingActive(row) && isPublicMvpListing(row);
}

function dedupeListings(items: PublicProfileListingItem[]): PublicProfileListingItem[] {
  const map = new Map<string, PublicProfileListingItem>();
  for (const item of items) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    if (existing.profileRole === "cohost" && item.profileRole === "owner") {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

export function resolvePublicProfileRoleLabel(
  ownedCount: number,
  cohostedCount: number
): string {
  if (ownedCount > 0 && cohostedCount > 0) return "Ιδιοκτήτης και συνοικοδεσπότης";
  if (cohostedCount > 0) return "Συνοικοδεσπότης";
  if (ownedCount > 0) return "Ιδιοκτήτης";
  return "Χρήστης Midora";
}

export async function getPublicProfileBySlugOrId(
  slugOrId: string
): Promise<PublicProfileRecord | null> {
  const supabase = getPublicProfileReadClient();
  if (!supabase) return null;

  const profile = await fetchPublicProfileRow(supabase, slugOrId);
  if (!profile) return null;
  if (profile.public_profile_enabled === false) return null;
  if (profile.account_status === "suspended") return null;

  return profile;
}

export async function getPublicOwnedListings(
  userId: string
): Promise<PublicProfileListingItem[]> {
  const supabase = getPublicProfileReadClient();
  if (!supabase) return [];

  const { data: listingRows, error: listingsError } = await supabase
    .from("listings")
    .select(LISTING_CARD_SELECT_MINIMAL)
    .eq("user_id", userId)
    .eq("status", "approved");

  if (listingsError) {
    console.error("[public-profile] owned listings failed:", listingsError.message);
    return [];
  }

  const rows = await attachPublicProfileListingImages(
    supabase,
    (listingRows as PublicProfileListingCardRow[]).map((listing) => ({
      ...listing,
      listing_images: listing.listing_images ?? [],
    }))
  );

  if (!rows.length) return [];

  return rows
    .filter(isPublicListingRow)
    .map((listing) => ({ ...listing, profileRole: "owner" as const }));
}

export async function getPublicCohostedListings(
  userId: string
): Promise<PublicProfileListingItem[]> {
  const supabase = createServiceClient() ?? getPublicProfileReadClient();
  if (!supabase) return [];

  let memberships: { listing_id: string }[] | null = null;

  const primary = await supabase
    .from("listing_cohosts")
    .select("listing_id")
    .eq("cohost_user_id", userId)
    .eq("status", "accepted");

  if (primary.error) {
    console.error("[public-profile] cohost memberships failed:", primary.error.message);
  } else {
    memberships = primary.data;
  }

  if (!memberships?.length) {
    const fallback = await supabase
      .from("listing_cohosts")
      .select("listing_id, cohost_user_id")
      .eq("status", "accepted");

    if (!fallback.error && fallback.data?.length) {
      memberships = fallback.data
        .filter((row) => row.cohost_user_id === userId)
        .map((row) => ({ listing_id: row.listing_id }));
    }
  }

  if (!memberships?.length) return [];

  const listingIds = memberships.map((m) => m.listing_id).filter(Boolean);
  if (!listingIds.length) return [];

  const { data: listingRows, error: listingsError } = await supabase
    .from("listings")
    .select(LISTING_CARD_SELECT_MINIMAL)
    .in("id", listingIds)
    .eq("status", "approved");

  if (listingsError) {
    console.error("[public-profile] cohosted listings failed:", listingsError.message);
    return [];
  }

  const rows = await attachPublicProfileListingImages(
    supabase,
    (listingRows as PublicProfileListingCardRow[]).map((listing) => ({
      ...listing,
      listing_images: listing.listing_images ?? [],
    }))
  );

  return finishCohostRows(rows, userId);
}

function finishCohostRows(
  rows: PublicProfileListingCardRow[],
  userId: string
): PublicProfileListingItem[] {
  return rows
    .filter(isPublicListingRow)
    .filter((listing) => listing.user_id !== userId)
    .map((listing) => ({ ...listing, profileRole: "cohost" as const }));
}

export async function getPublicProfilePageData(
  profile: PublicProfileRecord
): Promise<PublicProfilePageData | null> {
  const showOwned = profile.show_owned_listings_on_profile !== false;
  const showCohosted = profile.show_cohosted_listings_on_profile !== false;

  const [ownedRaw, cohostedRaw] = await Promise.all([
    showOwned ? getPublicOwnedListings(profile.id) : Promise.resolve([]),
    showCohosted ? getPublicCohostedListings(profile.id) : Promise.resolve([]),
  ]);

  const ownedListings = dedupeListings(ownedRaw);
  const cohostedListings = dedupeListings(
    cohostedRaw.filter((l) => !ownedListings.some((o) => o.id === l.id))
  );

  const totalVisible = ownedListings.length + cohostedListings.length;

  const avatarUrl =
    canShowPublicAvatar(profile) && profile.avatar_path
      ? resolveProfileAvatarUrl(profile, getSupabaseUrl())
      : null;

  return {
    profile,
    displayName: profileDisplayName(profile),
    avatarUrl,
    phoneVerified: Boolean(profile.primary_phone_verified_at),
    roleLabel: resolvePublicProfileRoleLabel(ownedListings.length, cohostedListings.length),
    ownedListings,
    cohostedListings,
    activeListingsCount: totalVisible,
  };
}

export function toPublicProfileApiPayload(data: PublicProfilePageData) {
  return {
    profile: {
      displayName: data.displayName,
      roleLabel: data.roleLabel,
      bio: data.profile.bio,
      advertiserType: data.profile.advertiser_type,
      businessName: data.profile.business_name,
      businessTitle: data.profile.business_title,
      languages: data.profile.communication_languages,
      joinedAt: data.profile.created_at,
      phoneVerified: data.phoneVerified,
      activeListingsCount: data.activeListingsCount,
      publicSlug: data.profile.public_slug,
    },
    ownedListings: data.ownedListings.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      area: l.area_display_name ?? l.area,
      city: l.city_display_name ?? l.city,
      rentalType: l.rental_type,
      role: l.profileRole,
    })),
    cohostedListings: data.cohostedListings.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      area: l.area_display_name ?? l.area,
      city: l.city_display_name ?? l.city,
      rentalType: l.rental_type,
      role: l.profileRole,
    })),
  };
}
