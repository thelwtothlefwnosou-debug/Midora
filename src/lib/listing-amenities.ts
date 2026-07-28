"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, authActionError } from "@/lib/action-error-i18n";
import {
  BILLS_AMENITY_KEYS,
  FURNISHED_AMENITY_KEYS,
  isKnownAmenityKey,
  normalizeAmenityKey,
  PARKING_AMENITY_KEYS,
} from "@/lib/amenities-catalog";
import type { ListingAmenityRow } from "@/lib/types";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

async function requireListingOwner(listingId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: await actionError("serviceUnavailable") } as const;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await authActionError("mustSignIn") } as const;

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listing) return { error: await actionError("listingNotFound") } as const;
  return { supabase, listing } as const;
}

function cleanAmenityKeys(keys: string[]): string[] {
  const unique = new Set<string>();
  for (const key of keys) {
    const normalized = normalizeAmenityKey(key.trim());
    if (isKnownAmenityKey(normalized)) unique.add(normalized);
  }
  return [...unique];
}

function listingBooleanPatch(keys: Set<string>) {
  const hasParking = [...PARKING_AMENITY_KEYS].some((key) => keys.has(key));
  const furnished = [...FURNISHED_AMENITY_KEYS].some((key) => keys.has(key));
  const utilitiesIncluded = [...BILLS_AMENITY_KEYS].some((key) => keys.has(key));

  return {
    has_parking: hasParking,
    has_elevator: keys.has("elevator") || keys.has("accessible_elevator"),
    has_balcony: keys.has("balcony") || keys.has("veranda") || keys.has("terrace"),
    pets_allowed: keys.has("pets_allowed") || keys.has("pets_on_request"),
    furnished,
    utilities_included: utilitiesIncluded,
  };
}

function revalidateListingPaths(listingId: string, slug?: string | null) {
  // Do not revalidate create-wizard or dashboard list — remounts left Next stuck.
  revalidatePath(`/listings/${listingId}`);
  if (slug) revalidatePath(`/listings/${slug}`);
  // Workspace edit only (not /dashboard/listings/new).
  revalidatePath(`/dashboard/listings/${listingId}`);
}

export async function getOwnerListingAmenities(
  listingId: string
): Promise<ListingAmenityRow[]> {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return [];

  const { data, error } = await auth.supabase
    .from("listing_amenities")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error) {
    if (isMissingTable(error)) return [];
    console.error("[listing-amenities] read", error.message);
    return [];
  }

  return (data ?? []) as ListingAmenityRow[];
}

export async function getListingAmenitiesIndex(): Promise<Map<string, string[]>> {
  const supabase = await createClient();
  const index = new Map<string, string[]>();
  if (!supabase) return index;

  const { data, error } = await supabase
    .from("listing_amenities")
    .select("listing_id, amenity_key");

  if (error) {
    if (!isMissingTable(error)) {
      console.error("[listing-amenities] index", error.message);
    }
    return index;
  }

  for (const row of data ?? []) {
    const normalized = normalizeAmenityKey(row.amenity_key);
    if (!isKnownAmenityKey(normalized)) continue;
    const list = index.get(row.listing_id) ?? [];
    if (!list.includes(normalized)) list.push(normalized);
    index.set(row.listing_id, list);
  }

  return index;
}

export async function saveOwnerListingAmenities(listingId: string, keys: string[]) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const cleaned = cleanAmenityKeys(keys);
  const keySet = new Set(cleaned);

  const { error: deleteError } = await auth.supabase
    .from("listing_amenities")
    .delete()
    .eq("listing_id", listingId);

  if (deleteError && !isMissingTable(deleteError)) {
    console.error("[listing-amenities] delete", deleteError.message);
    return { error: await actionError("amenitiesSaveFailed") };
  }

  if (cleaned.length > 0) {
    const insertRows = cleaned.map((amenity_key, sort_order) => ({
      listing_id: listingId,
      amenity_key,
      sort_order,
    }));

    const { error: insertError } = await auth.supabase
      .from("listing_amenities")
      .insert(insertRows);

    if (insertError && !isMissingTable(insertError)) {
      console.error("[listing-amenities] insert", insertError.message);
      return { error: await actionError("amenitiesSaveFailed") };
    }
  }

  const boolPatch = listingBooleanPatch(keySet);
  const { error: listingError } = await auth.supabase
    .from("listings")
    .update(boolPatch)
    .eq("id", listingId);

  if (listingError) {
    console.error("[listing-amenities] listing sync", listingError.message);
  }

  revalidateListingPaths(listingId, auth.listing.slug);
  return { success: true, count: cleaned.length };
}
