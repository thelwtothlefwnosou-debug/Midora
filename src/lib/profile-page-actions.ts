"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileRow } from "@/lib/profile-db-write";
import { PROFILE_BIO_MAX } from "@/lib/profile-display";
import {
  ensureUniquePublicProfileSlug,
  isValidPublicProfileSlug,
  normalizePublicProfileSlug,
  slugifyPublicProfileName,
} from "@/lib/profile-slug";

export type ProfilePageSaveState = {
  error?: string;
  success?: boolean;
};

function parseLanguages(formData: FormData): string[] {
  const raw = formData.getAll("communication_languages");
  return raw.map((v) => String(v).trim()).filter(Boolean);
}

function parseBooleanField(formData: FormData, name: string, defaultValue: boolean): boolean {
  const raw = formData.get(name);
  if (raw == null) return defaultValue;
  return String(raw) === "true";
}

export async function updateOwnerProfilePage(
  _prev: ProfilePageSaveState | null,
  formData: FormData
): Promise<ProfilePageSaveState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Η υπηρεσία δεν είναι διαθέσιμη." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς." };

  const fullName = (formData.get("full_name") as string)?.trim();
  const displayName = (formData.get("display_name") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const advertiserType = (formData.get("advertiser_type") as string) || "individual";
  const preferredContact =
    (formData.get("preferred_contact_method") as string) || "message";
  const businessName = (formData.get("business_name") as string)?.trim() || null;
  const businessTitle = (formData.get("business_title") as string)?.trim() || null;
  const languages = parseLanguages(formData);
  const publicSlugInput = (formData.get("public_slug") as string)?.trim() || "";
  const publicProfileEnabled = parseBooleanField(formData, "public_profile_enabled", true);
  const showOwnedListings = parseBooleanField(
    formData,
    "show_owned_listings_on_profile",
    true
  );
  const showCohostedListings = parseBooleanField(
    formData,
    "show_cohosted_listings_on_profile",
    true
  );

  if (!fullName) return { error: "Συμπλήρωσε το ονοματεπώνυμο." };
  if (bio && bio.length > PROFILE_BIO_MAX) {
    return { error: `Η περιγραφή δεν μπορεί να υπερβαίνει τους ${PROFILE_BIO_MAX} χαρακτήρες.` };
  }
  if (advertiserType !== "individual" && advertiserType !== "professional") {
    return { error: "Μη έγκυρος τύπος αγγελιοδότη." };
  }
  if (!["message", "phone", "email"].includes(preferredContact)) {
    return { error: "Μη έγκυρη προτίμηση επικοινωνίας." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("phone, public_slug")
    .eq("id", user.id)
    .maybeSingle();

  const phone = existing?.phone?.trim();
  if (!phone) {
    return {
      error: "Πρόσθεσε τηλέφωνο από τις ρυθμίσεις επικοινωνίας πριν αποθηκεύσεις.",
    };
  }

  const isSlugTaken = async (slug: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("public_slug", slug)
      .neq("id", user.id)
      .maybeSingle();
    return Boolean(data);
  };

  let publicSlug: string | null = null;
  if (publicSlugInput) {
    publicSlug = normalizePublicProfileSlug(publicSlugInput);
    if (!isValidPublicProfileSlug(publicSlug)) {
      return {
        error:
          "Μη έγκυρο URL προφίλ — χρησιμοποίησε μόνο λατινικούς χαρακτήρες, αριθμούς και παύλες (3–60 χαρακτήρες).",
      };
    }
    if (await isSlugTaken(publicSlug)) {
      return { error: "Αυτό το URL προφίλ χρησιμοποιείται ήδη από άλλον χρήστη." };
    }
  } else if (existing?.public_slug?.trim()) {
    publicSlug = existing.public_slug.trim();
  } else {
    publicSlug = await ensureUniquePublicProfileSlug(
      slugifyPublicProfileName(displayName || fullName),
      isSlugTaken
    );
  }

  const row: Record<string, unknown> = {
    full_name: fullName,
    display_name: displayName,
    bio,
    advertiser_type: advertiserType,
    communication_languages: languages,
    preferred_contact_method: preferredContact,
    business_name: advertiserType === "professional" ? businessName : null,
    business_title: advertiserType === "professional" ? businessTitle : null,
    public_slug: publicSlug,
    public_profile_enabled: publicProfileEnabled,
    show_owned_listings_on_profile: showOwnedListings,
    show_cohosted_listings_on_profile: showCohostedListings,
  };

  const { error } = await updateProfileRow(supabase, user.id, row);
  if (error) return { error: error.message };

  await supabase.auth.updateUser({
    data: { full_name: fullName, display_name: displayName ?? fullName },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/messages");
  revalidatePath("/listings", "layout");
  if (publicSlug) {
    revalidatePath(`/users/${publicSlug}`);
  }
  revalidatePath(`/users/${user.id}`);
  return { success: true };
}
