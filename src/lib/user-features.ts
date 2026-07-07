import { createClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/lib/types";
import {
  getFavoriteListingIdsForUser,
  getFavoriteListingsForUser,
} from "@/lib/favorites";

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[saved_searches]", error.message);
    return [];
  }

  return (data ?? []) as SavedSearch[];
}

export async function getFavoriteListingIds(): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getFavoriteListingIdsForUser(supabase, user.id);
}

export async function getFavoriteListings() {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getFavoriteListingsForUser(supabase, user.id);
}
