"use server";

import { actionError, authActionError, mustSignInError } from "@/lib/action-error-i18n";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readStoredBedrooms, writeStoredBedrooms } from "@/lib/listing-bedroom-storage";
import type { ListingSleepingArrangement } from "@/lib/types";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function isSchemaMismatch(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const msg = error.message?.toLowerCase() ?? "";
  return msg.includes("listing_image_id") || msg.includes("bed_size_note");
}

export type BedroomInput = {
  room_name: string;
  bed_type: string;
  quantity?: number;
  bed_size_note?: string | null;
  listing_image_id?: string | null;
};

async function requireListingOwner(listingId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: await actionError("serviceUnavailable") } as const;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return await mustSignInError();

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listing) return { error: await actionError("listingNotFound") } as const;
  return { supabase, user } as const;
}

export async function getOwnerSleepingArrangements(
  listingId: string
): Promise<ListingSleepingArrangement[]> {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return [];

  const { data, error } = await auth.supabase
    .from("listing_sleeping_arrangements")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error && isMissingTable(error)) {
    return (await readStoredBedrooms(listingId)) ?? [];
  }

  if (error) {
    console.error("[sleeping-arrangements] read", error.message);
    return [];
  }

  if ((data ?? []).length > 0) return data as ListingSleepingArrangement[];

  return (await readStoredBedrooms(listingId)) ?? [];
}

export async function getPublicSleepingArrangements(
  listingId: string
): Promise<ListingSleepingArrangement[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_sleeping_arrangements")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error && isMissingTable(error)) {
    return (await readStoredBedrooms(listingId)) ?? [];
  }

  if (error) return [];

  if ((data ?? []).length > 0) return data as ListingSleepingArrangement[];

  return (await readStoredBedrooms(listingId)) ?? [];
}

async function saveToStorage(
  listingId: string,
  rows: ListingSleepingArrangement[]
): Promise<{ arrangements: ListingSleepingArrangement[] } | { error: string }> {
  const ok = await writeStoredBedrooms(listingId, rows);
  if (!ok) return { error: await actionError("bedroomsSaveFailed") };
  return { arrangements: rows };
}

export async function saveOwnerSleepingArrangements(
  listingId: string,
  inputs: BedroomInput[]
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const cleaned = inputs
    .map((row, index) => ({
      room_name: row.room_name.trim(),
      bed_type: row.bed_type.trim(),
      quantity: Math.max(1, row.quantity ?? 1),
      bed_size_note: row.bed_size_note?.trim() || null,
      listing_image_id: row.listing_image_id?.trim() || null,
      sort_order: index,
    }))
    .filter((row) => row.room_name && row.bed_type);

  if (cleaned.length > 8) {
    return { error: await actionError("maxBedrooms") };
  }

  const { error: deleteError } = await auth.supabase
    .from("listing_sleeping_arrangements")
    .delete()
    .eq("listing_id", listingId);

  if (deleteError && (isMissingTable(deleteError) || isSchemaMismatch(deleteError))) {
    const now = new Date().toISOString();
    const rows: ListingSleepingArrangement[] = cleaned.map((row) => ({
      id: crypto.randomUUID(),
      listing_id: listingId,
      room_name: row.room_name,
      bed_type: row.bed_type,
      quantity: row.quantity,
      bed_size_note: row.bed_size_note,
      listing_image_id: row.listing_image_id,
      sort_order: row.sort_order,
      created_at: now,
    }));
    const stored = await saveToStorage(listingId, rows);
    if ("error" in stored) return stored;
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/listings/${listingId}`);
    return { success: true, arrangements: stored.arrangements };
  }

  if (deleteError) {
    console.error("[sleeping-arrangements] delete", deleteError.message);
    return { error: await actionError("bedroomsSaveFailed") };
  }

  if (cleaned.length === 0) {
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/listings/${listingId}`);
    return { success: true, arrangements: [] as ListingSleepingArrangement[] };
  }

  const insertRows = cleaned.map((row) => ({
    listing_id: listingId,
    room_name: row.room_name,
    bed_type: row.bed_type,
    quantity: row.quantity,
    bed_size_note: row.bed_size_note,
    listing_image_id: row.listing_image_id,
    sort_order: row.sort_order,
  }));

  const { data, error: insertError } = await auth.supabase
    .from("listing_sleeping_arrangements")
    .insert(insertRows)
    .select("*");

  if (insertError && (isMissingTable(insertError) || isSchemaMismatch(insertError))) {
    const now = new Date().toISOString();
    const rows: ListingSleepingArrangement[] = cleaned.map((row) => ({
      id: crypto.randomUUID(),
      listing_id: listingId,
      room_name: row.room_name,
      bed_type: row.bed_type,
      quantity: row.quantity,
      bed_size_note: row.bed_size_note,
      listing_image_id: row.listing_image_id,
      sort_order: row.sort_order,
      created_at: now,
    }));
    const stored = await saveToStorage(listingId, rows);
    if ("error" in stored) return stored;
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/listings/${listingId}`);
    return { success: true, arrangements: stored.arrangements };
  }

  if (insertError) {
    console.error("[sleeping-arrangements] insert", insertError.message);
    return { error: await actionError("bedroomsSaveFailed") };
  }

  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);

  return {
    success: true,
    arrangements: (data ?? []) as ListingSleepingArrangement[],
  };
}
