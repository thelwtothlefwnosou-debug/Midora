import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isListingActive } from "@/lib/listings";
import type { ListingWithImages } from "@/lib/types";

export type FavoriteRow = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};

const METADATA_KEY = "favorite_listing_ids";

let favoritesTableAvailable: boolean | null = null;

export function isFavoritesTableMissingError(error: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("could not find the table") ||
    msg.includes('relation "favorites" does not exist') ||
    msg.includes("schema cache")
  );
}

export function mapFavoritesError(error: {
  message?: string;
  code?: string;
}): string {
  return error.message ?? "Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.";
}

function readMetadataIds(user: User): string[] {
  const raw = user.user_metadata?.[METADATA_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

async function writeMetadataIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<{ error?: string }> {
  const unique = [...new Set(ids)];
  const { error } = await supabase.auth.updateUser({
    data: { [METADATA_KEY]: unique },
  });
  if (error) return { error: mapFavoritesError(error) };
  return {};
}

async function tableIsAvailable(supabase: SupabaseClient): Promise<boolean> {
  if (favoritesTableAvailable !== null) return favoritesTableAvailable;

  const { error } = await supabase.from("favorites").select("listing_id").limit(1);
  favoritesTableAvailable = !error || !isFavoritesTableMissingError(error);
  return favoritesTableAvailable;
}

export async function getFavoriteListingIdsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return [];

  if (!(await tableIsAvailable(supabase))) {
    return readMetadataIds(user);
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);

  if (error) {
    if (isFavoritesTableMissingError(error)) return readMetadataIds(user);
    console.error("[favorites]", error.message);
    return readMetadataIds(user);
  }

  return (data ?? []).map((row) => row.listing_id);
}

export async function isListingFavorited(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
): Promise<boolean> {
  const ids = await getFavoriteListingIdsForUser(supabase, userId);
  return ids.includes(listingId);
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Πρέπει να συνδεθείς" };

  if (!(await tableIsAvailable(supabase))) {
    const ids = readMetadataIds(user);
    if (ids.includes(listingId)) return {};
    return writeMetadataIds(supabase, [...ids, listingId]);
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    listing_id: listingId,
  });

  if (error) {
    if (error.code === "23505") return {};
    if (isFavoritesTableMissingError(error)) {
      const ids = readMetadataIds(user);
      if (ids.includes(listingId)) return {};
      return writeMetadataIds(supabase, [...ids, listingId]);
    }
    return { error: mapFavoritesError(error) };
  }

  return {};
}

export async function removeFavoriteByIds(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: "Πρέπει να συνδεθείς" };

  if (!(await tableIsAvailable(supabase))) {
    return writeMetadataIds(
      supabase,
      readMetadataIds(user).filter((id) => id !== listingId)
    );
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    if (isFavoritesTableMissingError(error)) {
      return writeMetadataIds(
        supabase,
        readMetadataIds(user).filter((id) => id !== listingId)
      );
    }
    return { error: mapFavoritesError(error) };
  }

  return {};
}

export async function toggleFavoriteForUser(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
): Promise<{ favorited: boolean; error?: string }> {
  const favorited = await isListingFavorited(supabase, userId, listingId);

  if (favorited) {
    const result = await removeFavoriteByIds(supabase, userId, listingId);
    if (result.error) return { favorited: true, error: result.error };
    return { favorited: false };
  }

  const result = await addFavorite(supabase, userId, listingId);
  if (result.error) return { favorited: false, error: result.error };
  return { favorited: true };
}

async function fetchListingsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<ListingWithImages[]> {
  if (!ids.length) return [];

  const { data: listings, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), profiles(full_name, phone)")
    .in("id", ids);

  if (error) {
    console.error("[favorites/listings]", error.message);
    return [];
  }

  if (!listings) return [];

  const active = listings.filter((listing) => isListingActive(listing));
  const order = new Map(ids.map((id, index) => [id, index]));

  return active.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  ) as ListingWithImages[];
}

export async function getFavoriteListingsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ListingWithImages[]> {
  const ids = await getFavoriteListingIdsForUser(supabase, userId);
  return fetchListingsByIds(supabase, ids);
}

export const FAVORITES_REVALIDATE_PATHS = [
  "/dashboard/favorites",
  "/favorites",
  "/listings",
  "/",
] as const;

export function revalidateFavoritePaths(revalidatePath: (path: string) => void) {
  for (const path of FAVORITES_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/favorites/compare");
}
