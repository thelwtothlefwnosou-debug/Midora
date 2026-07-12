import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isListingActive } from "@/lib/listings";
import { isPublicMvpListing } from "@/lib/rental-types";
import { canShowPublicAvatar, resolveProfileAvatarUrl } from "@/lib/profile-avatar";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { profileDisplayName } from "@/lib/profile-display";
import { isUuidLike } from "@/lib/profile-slug";
import type { ListingWithImages, Profile } from "@/lib/types";

export const PUBLIC_PROFILE_SELECT =
  "id, full_name, display_name, bio, advertiser_type, business_name, business_title, communication_languages, created_at, primary_phone_verified_at, avatar_path, avatar_status, show_profile_photo_public, public_slug, public_profile_enabled, show_owned_listings_on_profile, show_cohosted_listings_on_profile, account_status" as const;

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

const LISTING_CARD_SELECT =
  "id, slug, title, area, city, area_display_name, city_display_name, rental_type, price_type, price_per_night, price_monthly, price, bedrooms, bathrooms, sqm, max_guests, min_stay_nights, min_months, status, is_hidden, expires_at, included_guests, extra_guest_fee_per_night, weekend_price_per_night, weekend_days, weekly_discount_percent, monthly_discount_percent, user_id, listing_images(url, media_type, is_cover, sort_order)";

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
  const supabase = await createClient();
  if (!supabase) return null;

  const trimmed = slugOrId.trim();
  if (!trimmed) return null;

  let query = supabase.from("profiles").select(PUBLIC_PROFILE_SELECT);

  if (isUuidLike(trimmed)) {
    query = query.eq("id", trimmed);
  } else {
    query = query.eq("public_slug", trimmed.toLowerCase());
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const profile = data as PublicProfileRecord;
  if (profile.public_profile_enabled === false) return null;
  if (profile.account_status === "suspended") return null;

  return profile;
}

export async function getPublicOwnedListings(
  userId: string
): Promise<PublicProfileListingItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_CARD_SELECT)
    .eq("user_id", userId)
    .eq("status", "approved")
    .eq("is_hidden", false)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) return [];

  return (data as unknown as PublicProfileListingCardRow[])
    .filter(isPublicListingRow)
    .map((listing) => ({ ...listing, profileRole: "owner" as const }));
}

export async function getPublicCohostedListings(
  userId: string
): Promise<PublicProfileListingItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: memberships, error } = await supabase
    .from("listing_cohosts")
    .select(`listing_id, listings(${LISTING_CARD_SELECT})`)
    .eq("cohost_user_id", userId)
    .eq("status", "accepted");

  if (error || !memberships?.length) return [];

  const items: PublicProfileListingItem[] = [];
  for (const row of memberships) {
    const listing = row.listings as unknown as PublicProfileListingCardRow | null;
    if (!listing || !isPublicListingRow(listing)) continue;
    if (listing.user_id === userId) continue;
    items.push({ ...listing, profileRole: "cohost" });
  }

  return items;
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
  if (totalVisible === 0) return null;

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
