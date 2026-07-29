"use server";

import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-error-i18n";
import { requireServiceUser } from "@/lib/require-auth";
import { LISTING_SAVE_ERROR_MSG } from "@/lib/listing-wizard-validation";

async function requireListingOwner(listingId: string) {
  const auth = await requireServiceUser();
  if ("error" in auth) return auth;

  const { data: listing } = await auth.supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!listing) return { error: await actionError("listingNotFound") } as const;
  return { supabase: auth.supabase, user: auth.user } as const;
}

function parseWeekendDays(raw: FormData): number[] {
  const values = raw.getAll("weekend_days").map((v) => parseInt(String(v), 10));
  const valid = values.filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);
  return valid.length > 0 ? valid : [5, 6];
}

function parseOptionalInt(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function saveShortTermPricingSettings(
  listingId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const basePrice = parseInt((formData.get("price_per_night") as string) || "", 10);
  const weekendPrice = parseOptionalInt(formData.get("weekend_price_per_night") as string);
  const minNights = parseOptionalInt(formData.get("minimum_stay_nights") as string);
  const weeklyDiscount = parseOptionalInt(formData.get("weekly_discount_percent") as string);
  const monthlyDiscount = parseOptionalInt(formData.get("monthly_discount_percent") as string);
  const cleaningNote = (formData.get("cleaning_fee_note") as string)?.trim() || null;
  const weekendDays = parseWeekendDays(formData);

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return { error: await actionError("pricingBaseRequired") };
  }
  if (weeklyDiscount != null && (weeklyDiscount < 0 || weeklyDiscount > 90)) {
    return { error: await actionError("weeklyDiscountRange") };
  }
  if (monthlyDiscount != null && (monthlyDiscount < 0 || monthlyDiscount > 90)) {
    return { error: await actionError("monthlyDiscountRange") };
  }

  const row: Record<string, unknown> = {
    price_per_night: basePrice,
    weekend_price_per_night: weekendPrice,
    weekend_days: weekendDays,
    minimum_stay_nights: minNights ?? 2,
    weekly_discount_percent: weeklyDiscount,
    monthly_discount_percent: monthlyDiscount,
    cleaning_fee_note: cleaningNote,
    updated_at: new Date().toISOString(),
  };

  const { error } = await auth.supabase.from("listings").update(row).eq("id", listingId);
  if (error) {
    const missing = error.message.includes("does not exist");
    if (missing) {
      const fallback = { price_per_night: basePrice, minimum_stay_nights: minNights ?? 2 };
      const { error: fbError } = await auth.supabase
        .from("listings")
        .update(fallback)
        .eq("id", listingId);
      if (fbError) return { error: await actionError("listingSaveFailed") };
    } else {
      return { error: error.message };
    }
  }

  revalidatePath(`/dashboard/listings/${listingId}/availability`);
  revalidatePath(`/dashboard/listings/${listingId}/pricing`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function saveSpecialPricingPeriod(
  listingId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const name = (formData.get("name") as string)?.trim();
  const startDate = (formData.get("start_date") as string)?.trim();
  const endDate = (formData.get("end_date") as string)?.trim();
  const pricePerNight = parseInt((formData.get("price_per_night") as string) || "", 10);
  const minStay = parseOptionalInt(formData.get("min_stay_nights") as string);
  const blocked = formData.get("blocked") === "on";

  if (!name) return { error: await actionError("periodNameRequired") };
  if (!startDate || !endDate) return { error: await actionError("pricingDatesRequired") };
  if (endDate < startDate) return { error: await actionError("pricingEndBeforeStart") };

  if (blocked) {
    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("start_date", startDate);
    fd.set("end_date", endDate);
    fd.set("reason", "unavailable");
    fd.set("note", name);
    const { saveUnavailablePeriod } = await import("@/lib/actions");
    const result = await saveUnavailablePeriod(fd);
    if (result?.error) return { error: result.error };
  } else {
    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
      return { error: await actionError("periodPriceRequired") };
    }
    const { saveCalendarPriceRule } = await import("@/lib/listing-price-rules");
    const result = await saveCalendarPriceRule(
      listingId,
      startDate,
      endDate,
      pricePerNight,
      name
    );
    if (result?.error) return { error: result.error };
    if (minStay && minStay > 0) {
      await auth.supabase
        .from("listing_price_rules")
        .update({ min_stay_nights: minStay })
        .eq("listing_id", listingId)
        .eq("start_date", startDate)
        .eq("end_date", endDate);
    }
  }

  revalidatePath(`/dashboard/listings/${listingId}/availability`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function saveMonthlyPricingSettings(
  listingId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const modeRaw = (formData.get("monthly_pricing_mode") as string)?.trim();
  const mode =
    modeRaw === "fixed" || modeRaw === "extra_person" || modeRaw === "tiers"
      ? modeRaw
      : "extra_person";

  const basePrice = parseInt(
    (formData.get("monthly_base_price") as string) ||
      (formData.get("price_monthly") as string) ||
      "",
    10
  );
  const includedPeople = parseOptionalInt(
    formData.get("monthly_included_people") as string
  );
  const maxPeople = parseOptionalInt(formData.get("monthly_max_people") as string);
  const extraPersonPrice = parseOptionalInt(
    formData.get("monthly_extra_person_price") as string
  );
  const maxPrice = parseOptionalInt(formData.get("monthly_max_price") as string);

  if (mode !== "tiers" && (!Number.isFinite(basePrice) || basePrice <= 0)) {
    return { error: await actionError("pricingBaseRequired") };
  }

  let tiers: { people_from: number; people_to: number; monthly_price: number }[] =
    [];
  if (mode === "tiers") {
    const raw = (formData.get("monthly_price_tiers_json") as string)?.trim();
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        tiers = parsed
          .map((t: Record<string, unknown>) => ({
            people_from: Number(t.people_from),
            people_to: Number(t.people_to),
            monthly_price: Number(t.monthly_price),
          }))
          .filter(
            (t) =>
              Number.isFinite(t.people_from) &&
              Number.isFinite(t.people_to) &&
              Number.isFinite(t.monthly_price) &&
              t.monthly_price > 0
          );
      }
    } catch {
      return { error: await actionError("listingSaveFailed") };
    }
    if (tiers.length === 0) {
      return { error: await actionError("pricingBaseRequired") };
    }
  }

  const resolvedBase =
    mode === "tiers"
      ? tiers[0]?.monthly_price ?? null
      : basePrice;

  const row: Record<string, unknown> = {
    monthly_pricing_mode: mode,
    monthly_base_price: resolvedBase,
    price_monthly: resolvedBase,
    monthly_included_people: includedPeople ?? 2,
    monthly_max_people: maxPeople,
    monthly_extra_person_price: extraPersonPrice,
    monthly_max_price: maxPrice,
    max_guests: maxPeople ?? includedPeople ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await auth.supabase.from("listings").update(row).eq("id", listingId);
  if (error) return { error: error.message };

  const { replaceListingMonthlyPriceTiers } = await import(
    "@/lib/listing-monthly-tiers-db"
  );
  await replaceListingMonthlyPriceTiers(
    auth.supabase,
    listingId,
    auth.user.id,
    mode === "tiers" ? tiers : []
  );

  revalidatePath(`/dashboard/listings/${listingId}/pricing`);
  revalidatePath(`/dashboard/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}
