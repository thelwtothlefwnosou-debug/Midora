"use server";

import { actionError, authActionError, mustSignInError } from "@/lib/action-error-i18n";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LISTING_SAVE_ERROR_MSG } from "@/lib/listing-wizard-validation";
import {
  readStoredPriceRules,
  writeStoredPriceRules,
} from "@/lib/listing-price-rules-storage";
import type { ListingPriceRule } from "@/lib/types";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}
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

function toSaveError() {
  return LISTING_SAVE_ERROR_MSG;
}

export async function getListingPriceRules(listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("listing_price_rules")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date");

  if (error) {
    if (isMissingTable(error)) {
      const stored = await readStoredPriceRules(listingId);
      return { rules: stored ?? [] };
    }
    return { error: toSaveError() };
  }

  if ((data ?? []).length > 0) return { rules: data as ListingPriceRule[] };

  const stored = await readStoredPriceRules(listingId);
  return { rules: stored ?? [] };
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

async function saveCalendarPriceRuleToStorage(
  listingId: string,
  ownerId: string,
  startDate: string,
  endDate: string,
  pricePerNight: number,
  label: string
): Promise<{ rules: ListingPriceRule[] } | { error: string }> {
  const existing = (await readStoredPriceRules(listingId)) ?? [];
  const now = new Date().toISOString();
  const overlappingIds = existing
    .filter((r) => rangesOverlap(startDate, endDate, r.start_date, r.end_date))
    .map((r) => r.id);
  const next = existing.filter((r) => !overlappingIds.includes(r.id));
  next.push({
    id: crypto.randomUUID(),
    listing_id: listingId,
    owner_id: ownerId,
    start_date: startDate,
    end_date: endDate,
    label,
    price_per_night: pricePerNight,
    included_guests: null,
    extra_guest_fee_per_night: null,
    min_stay_nights: null,
    created_at: now,
    updated_at: now,
  });
  next.sort((a, b) => a.start_date.localeCompare(b.start_date));
  const ok = await writeStoredPriceRules(listingId, next);
  if (!ok) return { error: toSaveError() };
  return { rules: next };
}

export async function saveListingPriceRule(listingId: string, formData: FormData) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const id = (formData.get("id") as string)?.trim() || null;
  const startDate = (formData.get("start_date") as string)?.trim();
  const endDate = (formData.get("end_date") as string)?.trim();
  const label = (formData.get("label") as string)?.trim() || null;
  const pricePerNight = parseInt((formData.get("price_per_night") as string) || "", 10);
  const includedGuests = parseInt((formData.get("included_guests") as string) || "", 10);
  const extraFee = parseInt((formData.get("extra_guest_fee_per_night") as string) || "", 10);
  const minStay = parseInt((formData.get("min_stay_nights") as string) || "", 10);

  if (!startDate || !endDate) return { error: await actionError("pricingDatesStartEndRequired") };
  if (endDate < startDate) return { error: await actionError("pricingEndAfterStart") };
  if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    return { error: await actionError("pricingNightPriceRequired") };
  }

  const { data: existingRules } = await auth.supabase
    .from("listing_price_rules")
    .select("id, start_date, end_date")
    .eq("listing_id", listingId);

  const overlap = (existingRules ?? []).some(
    (r) =>
      r.id !== id &&
      rangesOverlap(startDate, endDate, r.start_date, r.end_date)
  );
  if (overlap) {
    return { error: await actionError("pricingOverlap") };
  }

  const row = {
    listing_id: listingId,
    owner_id: auth.user.id,
    start_date: startDate,
    end_date: endDate,
    label,
    price_per_night: pricePerNight,
    included_guests: Number.isFinite(includedGuests) ? includedGuests : null,
    extra_guest_fee_per_night: Number.isFinite(extraFee) ? extraFee : null,
    min_stay_nights: Number.isFinite(minStay) ? minStay : null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await auth.supabase
      .from("listing_price_rules")
      .update(row)
      .eq("id", id)
      .eq("listing_id", listingId);
    if (error) return { error: toSaveError() };
  } else {
    const { error } = await auth.supabase.from("listing_price_rules").insert(row);
    if (error) return { error: toSaveError() };
  }

  revalidatePath(`/dashboard/listings/${listingId}/pricing`);
  return { success: true };
}

export async function deleteListingPriceRule(listingId: string, ruleId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from("listing_price_rules")
    .delete()
    .eq("id", ruleId)
    .eq("listing_id", listingId);

  if (error) return { error: toSaveError() };
  revalidatePath(`/dashboard/listings/${listingId}/pricing`);
  return { success: true };
}

export async function getApplicableNightlyPrice(
  listingId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: rules } = await supabase
    .from("listing_price_rules")
    .select("*")
    .eq("listing_id", listingId)
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .order("start_date")
    .limit(1);

  const rule = rules?.[0] as ListingPriceRule | undefined;
  if (!rule?.price_per_night) return null;

  return {
    pricePerNight: rule.price_per_night,
    includedGuests: rule.included_guests,
    extraGuestFee: rule.extra_guest_fee_per_night,
    label: rule.label,
  };
}

/** Save a price override from the owner calendar — replaces overlapping rules. */
export async function saveCalendarPriceRule(
  listingId: string,
  startDate: string,
  endDate: string,
  pricePerNight: number,
  label?: string | null
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  if (!startDate || !endDate) return { error: await actionError("pricingDatesRequired") };
  if (endDate < startDate) {
    return { error: await actionError("pricingEndAfterStart") };
  }
  if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    return { error: await actionError("pricingNightPriceRequired") };
  }

  const { data: existingRules, error: rulesError } = await auth.supabase
    .from("listing_price_rules")
    .select("id, start_date, end_date")
    .eq("listing_id", listingId);

  if (rulesError && isMissingTable(rulesError)) {
    const autoLabel =
      label?.trim() ||
      (startDate === endDate
        ? await actionError("specialPriceLabel", { start: startDate }) : await actionError("specialPriceRangeLabel", { start: startDate, end: endDate }));
    const stored = await saveCalendarPriceRuleToStorage(
      listingId,
      auth.user.id,
      startDate,
      endDate,
      pricePerNight,
      autoLabel
    );
    if ("error" in stored) return stored;
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/dashboard/listings/${listingId}/pricing`);
    return { success: true, rules: stored.rules };
  }

  const overlappingIds = (existingRules ?? [])
    .filter((r) => rangesOverlap(startDate, endDate, r.start_date, r.end_date))
    .map((r) => r.id);

  if (overlappingIds.length > 0) {
    const { error: deleteError } = await auth.supabase
      .from("listing_price_rules")
      .delete()
      .in("id", overlappingIds)
      .eq("listing_id", listingId);
    if (deleteError) return { error: toSaveError() };
  }

  const autoLabel =
    label?.trim() ||
    (startDate === endDate
      ? await actionError("specialPriceLabel", { start: startDate }) : await actionError("specialPriceRangeLabel", { start: startDate, end: endDate }));

  const { error } = await auth.supabase.from("listing_price_rules").insert({
    listing_id: listingId,
    owner_id: auth.user.id,
    start_date: startDate,
    end_date: endDate,
    label: autoLabel,
    price_per_night: pricePerNight,
    updated_at: new Date().toISOString(),
  });

  if (error && isMissingTable(error)) {
    const stored = await saveCalendarPriceRuleToStorage(
      listingId,
      auth.user.id,
      startDate,
      endDate,
      pricePerNight,
      autoLabel
    );
    if ("error" in stored) return stored;
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/dashboard/listings/${listingId}/pricing`);
    revalidatePath(`/listings/${listingId}`);
    return { success: true, rules: stored.rules };
  }

  if (error) return { error: toSaveError() };

  const { data: refreshed } = await auth.supabase
    .from("listing_price_rules")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date");

  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/dashboard/listings/${listingId}/pricing`);
  revalidatePath(`/listings/${listingId}`);

  return { success: true, rules: (refreshed ?? []) as ListingPriceRule[] };
}

export async function deleteCalendarPriceRule(listingId: string, ruleId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from("listing_price_rules")
    .delete()
    .eq("id", ruleId)
    .eq("listing_id", listingId);

  if (error && isMissingTable(error)) {
    const existing = (await readStoredPriceRules(listingId)) ?? [];
    const next = existing.filter((r) => r.id !== ruleId);
    const ok = await writeStoredPriceRules(listingId, next);
    if (!ok) return { error: toSaveError() };
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/dashboard/listings/${listingId}/pricing`);
    return { success: true, rules: next };
  }

  if (error) return { error: toSaveError() };

  const { data: refreshed } = await auth.supabase
    .from("listing_price_rules")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date");

  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/dashboard/listings/${listingId}/pricing`);
  revalidatePath(`/listings/${listingId}`);

  return { success: true, rules: (refreshed ?? []) as ListingPriceRule[] };
}
