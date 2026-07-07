import type { SupabaseClient } from "@supabase/supabase-js";

const REFERRAL_BONUS_MONTHS = 1;
const SEARCH_BOOST_DAYS = 30;

export function generateReferralCode(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function ensureReferralCode(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (data?.referral_code) return data.referral_code;

  const code = generateReferralCode(userId);
  await supabase
    .from("profiles")
    .update({ referral_code: code })
    .eq("id", userId);

  return code;
}

export async function resolveReferrerId(
  supabase: SupabaseClient,
  referralCode: string | null | undefined
): Promise<string | null> {
  const code = referralCode?.trim().toUpperCase();
  if (!code) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  return data?.id ?? null;
}

/** Ανταμοιβή στον referrer όταν εγκριθεί αγγελία referred host */
export async function rewardReferrerForListingApproval(
  supabase: SupabaseClient,
  listingOwnerId: string
) {
  const { data: owner } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", listingOwnerId)
    .maybeSingle();

  const referrerId = owner?.referred_by;
  if (!referrerId) return;

  const { data: referrerListings } = await supabase
    .from("listings")
    .select("id, expires_at")
    .eq("user_id", referrerId)
    .eq("status", "approved");

  const boostUntil = new Date();
  boostUntil.setDate(boostUntil.getDate() + SEARCH_BOOST_DAYS);

  for (const listing of referrerListings ?? []) {
    const expires = listing.expires_at
      ? new Date(listing.expires_at)
      : new Date();
    expires.setMonth(expires.getMonth() + REFERRAL_BONUS_MONTHS);

    await supabase
      .from("listings")
      .update({
        expires_at: expires.toISOString(),
        search_boost_until: boostUntil.toISOString(),
      })
      .eq("id", listing.id);
  }
}

export { REFERRAL_BONUS_MONTHS, SEARCH_BOOST_DAYS };
