"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileRow } from "@/lib/profile-db-write";
import { PROFILE_BIO_MAX } from "@/lib/profile-display";

export type ProfilePageSaveState = {
  error?: string;
  success?: boolean;
};

function parseLanguages(formData: FormData): string[] {
  const raw = formData.getAll("communication_languages");
  return raw.map((v) => String(v).trim()).filter(Boolean);
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
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  const phone = existing?.phone?.trim();
  if (!phone) {
    return {
      error: "Πρόσθεσε τηλέφωνο από τις ρυθμίσεις επικοινωνίας πριν αποθηκεύσεις.",
    };
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
  return { success: true };
}
