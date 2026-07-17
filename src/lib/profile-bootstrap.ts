import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isGenericProfileName,
  pickProfileFullName,
  resolveAuthProfileName,
  type AuthProfileNameInput,
} from "@/lib/auth-profile-name";
import { updateProfileRow } from "@/lib/profile-db-write";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ensureUniquePublicProfileSlug,
  slugifyPublicProfileName,
} from "@/lib/profile-slug";

export type ProfileBootstrapInput = {
  userId: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  displayName?: string | null;
  auth?: AuthProfileNameInput;
};

function generateReferralCodeFromId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

async function isPublicSlugTaken(
  db: SupabaseClient,
  slug: string,
  userId: string
): Promise<boolean> {
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("public_slug", slug)
    .neq("id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** Ensures every authenticated user has a profiles row and a unique public slug. */
export async function bootstrapAuthProfile(
  client: SupabaseClient | null,
  input: ProfileBootstrapInput
): Promise<void> {
  const db = createServiceClient() ?? client;
  if (!db) return;

  const { data: existing } = await db
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", input.userId)
    .maybeSingle();

  let existingPublicSlug: string | null = null;
  const { data: slugRow, error: slugSelectError } = await db
    .from("profiles")
    .select("public_slug")
    .eq("id", input.userId)
    .maybeSingle();
  if (!slugSelectError && slugRow?.public_slug) {
    existingPublicSlug = String(slugRow.public_slug).trim() || null;
  }

  let existingReferralCode: string | null = null;
  const { data: refRow, error: refSelectError } = await db
    .from("profiles")
    .select("referral_code")
    .eq("id", input.userId)
    .maybeSingle();
  if (!refSelectError && refRow?.referral_code) {
    existingReferralCode = String(refRow.referral_code).trim() || null;
  }

  const resolvedIncoming =
    input.fullName?.trim() ||
    resolveAuthProfileName({
      email: input.email,
      userMetadata: input.auth?.userMetadata,
      identities: input.auth?.identities,
    });

  const fullName = pickProfileFullName({
    incoming: resolvedIncoming,
    existing: existing?.full_name,
    email: input.email,
  });

  const phone = input.phone?.trim() || existing?.phone?.trim() || "";

  const displayNameCandidate =
    input.displayName?.trim() ||
    (!isGenericProfileName(fullName) ? fullName : null);

  const baseRow: Record<string, unknown> = {
    id: input.userId,
    full_name: fullName,
    referral_code: existingReferralCode ?? generateReferralCodeFromId(input.userId),
  };

  if (input.email) {
    // Only write when column exists — updateProfileRow strips unknown columns.
    // Never use upsert-only email without full_name (NOT NULL).
    baseRow.email = input.email;
  }

  if (displayNameCandidate) {
    baseRow.display_name = displayNameCandidate;
  }

  if (phone) {
    baseRow.phone = phone;
  } else if (!existing?.phone) {
    baseRow.phone = "";
  }

  const { error: baseError } = await updateProfileRow(db, input.userId, baseRow);
  if (baseError) {
    console.error("[profile-bootstrap] base upsert failed:", baseError.message);
    return;
  }

  if (existingPublicSlug) return;

  const publicSlug = await ensureUniquePublicProfileSlug(
    slugifyPublicProfileName(input.displayName || fullName),
    (slug) => isPublicSlugTaken(db, slug, input.userId)
  );

  // Partial patch via UPDATE (updateProfileRow) — never sparse upsert without full_name.
  const { error } = await updateProfileRow(db, input.userId, {
    public_slug: publicSlug,
    public_profile_enabled: true,
    show_owned_listings_on_profile: true,
    show_cohosted_listings_on_profile: true,
  });

  if (error) {
    console.error("[profile-bootstrap] public slug failed:", error.message);
  }
}
