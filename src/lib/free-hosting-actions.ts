"use server";

import { revalidatePath } from "next/cache";
import { requireListingOwner } from "@/lib/require-auth";
import type { FreeHostingOfferStatus } from "@/lib/free-hosting";

export type FreeHostingOfferRow = {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_exclusive: string;
  max_nights: number;
  max_guests: number;
  owner_message: string | null;
  status: FreeHostingOfferStatus;
  created_at: string;
  updated_at: string;
};

async function requireShortTermOwner(listingId: string) {
  const auth = await requireListingOwner(listingId, "owner_only");
  if ("error" in auth) return auth;

  const { data: listing } = await auth.supabase
    .from("listings")
    .select("rental_type")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.rental_type !== "short_term") {
    return { error: "freeHostingShortTermOnly" as const };
  }

  return auth;
}

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMigrationMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("listing_free_hosting_offers") ||
    msg.includes("schema cache")
  );
}

export async function listListingFreeHostingOffers(listingId: string) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("listing_free_hosting_offers")
    .select(
      "id, listing_id, owner_id, start_date, end_exclusive, max_nights, max_guests, owner_message, status, created_at, updated_at"
    )
    .eq("listing_id", listingId)
    .eq("owner_id", auth.user.id)
    .order("start_date", { ascending: true });

  if (error) {
    if (isMigrationMissing(error)) {
      return { offers: [] as FreeHostingOfferRow[], migrationRequired: true as const };
    }
    return { error: "freeHostingLoadFailed" as const };
  }

  return { offers: (data ?? []) as FreeHostingOfferRow[] };
}

export async function upsertListingFreeHostingOffer(input: {
  listingId: string;
  offerId?: string | null;
  startDate: string;
  endExclusive: string;
  maxNights: number;
  maxGuests: number;
  ownerMessage?: string | null;
  status: FreeHostingOfferStatus;
}) {
  const auth = await requireShortTermOwner(input.listingId);
  if ("error" in auth) return { error: auth.error, code: "auth" as const };

  if (!isYmd(input.startDate) || !isYmd(input.endExclusive)) {
    return { error: "freeHostingInvalidDates", code: "validation" as const };
  }
  if (input.endExclusive <= input.startDate) {
    return { error: "freeHostingInvalidRange", code: "validation" as const };
  }
  if (!Number.isFinite(input.maxNights) || input.maxNights < 1 || input.maxNights > 90) {
    return { error: "freeHostingInvalidMaxNights", code: "validation" as const };
  }
  if (!Number.isFinite(input.maxGuests) || input.maxGuests < 1 || input.maxGuests > 50) {
    return { error: "freeHostingInvalidMaxGuests", code: "validation" as const };
  }
  if (!["draft", "active", "paused", "ended"].includes(input.status)) {
    return { error: "freeHostingInvalidStatus", code: "validation" as const };
  }

  const payload = {
    listing_id: input.listingId,
    owner_id: auth.user.id,
    start_date: input.startDate,
    end_exclusive: input.endExclusive,
    max_nights: Math.floor(input.maxNights),
    max_guests: Math.floor(input.maxGuests),
    owner_message: input.ownerMessage?.trim() || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  const query = input.offerId
    ? auth.supabase
        .from("listing_free_hosting_offers")
        .update(payload)
        .eq("id", input.offerId)
        .eq("owner_id", auth.user.id)
        .select("id")
        .maybeSingle()
    : auth.supabase
        .from("listing_free_hosting_offers")
        .insert(payload)
        .select("id")
        .maybeSingle();

  const { data, error } = await query;

  if (error) {
    if (isMigrationMissing(error)) {
      return { error: "freeHostingMigrationRequired", code: "migration" as const };
    }
    return { error: "freeHostingSaveFailed", code: "db" as const };
  }

  revalidatePath(`/dashboard/listings/${input.listingId}/availability`);
  revalidatePath("/free-stays");
  return { ok: true as const, id: data?.id as string };
}

export async function setListingFreeHostingOfferStatus(input: {
  listingId: string;
  offerId: string;
  status: FreeHostingOfferStatus;
}) {
  const auth = await requireShortTermOwner(input.listingId);
  if ("error" in auth) return { error: auth.error };

  if (!["draft", "active", "paused", "ended"].includes(input.status)) {
    return { error: "freeHostingInvalidStatus" as const };
  }

  const { error } = await auth.supabase
    .from("listing_free_hosting_offers")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.offerId)
    .eq("listing_id", input.listingId)
    .eq("owner_id", auth.user.id);

  if (error) {
    if (isMigrationMissing(error)) {
      return { error: "freeHostingMigrationRequired" as const };
    }
    return { error: "freeHostingSaveFailed" as const };
  }

  revalidatePath(`/dashboard/listings/${input.listingId}/availability`);
  revalidatePath("/free-stays");
  return { ok: true as const };
}

export async function deleteListingFreeHostingOffer(input: {
  listingId: string;
  offerId: string;
}) {
  const auth = await requireShortTermOwner(input.listingId);
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from("listing_free_hosting_offers")
    .delete()
    .eq("id", input.offerId)
    .eq("listing_id", input.listingId)
    .eq("owner_id", auth.user.id);

  if (error) {
    if (isMigrationMissing(error)) {
      return { error: "freeHostingMigrationRequired" as const };
    }
    return { error: "freeHostingDeleteFailed" as const };
  }

  revalidatePath(`/dashboard/listings/${input.listingId}/availability`);
  revalidatePath("/free-stays");
  return { ok: true as const };
}
