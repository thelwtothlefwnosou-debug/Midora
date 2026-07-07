"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logAdminAudit } from "@/lib/admin/audit";
import {
  PROFILE_AVATARS_BUCKET,
  buildAvatarStoragePath,
  validateAvatarFile,
} from "@/lib/profile-avatar";

function mimeToExt(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function deleteAvatarAtPath(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  path: string | null | undefined
) {
  if (!path?.trim()) return;
  await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([path]);
}

export async function uploadProfileAvatar(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Η υπηρεσία δεν είναι διαθέσιμη." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς." };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return { error: "Επίλεξε μια φωτογραφία." };
  }

  const validationError = validateAvatarFile(file);
  if (validationError) return { error: validationError };

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const ext = mimeToExt(file.type);
  const storagePath = buildAvatarStoragePath(user.id, ext);

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_path: storagePath,
      avatar_updated_at: new Date().toISOString(),
      avatar_status: "active",
    })
    .eq("id", user.id);

  if (updateError) {
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([storagePath]);
    return { error: updateError.message };
  }

  if (profile?.avatar_path && profile.avatar_path !== storagePath) {
    await deleteAvatarAtPath(supabase, profile.avatar_path);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/profile");
  return { success: true as const };
}

export async function removeProfileAvatar() {
  const supabase = await createClient();
  if (!supabase) return { error: "Η υπηρεσία δεν είναι διαθέσιμη." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.avatar_path) {
    await deleteAvatarAtPath(supabase, profile.avatar_path);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_path: null,
      avatar_updated_at: new Date().toISOString(),
      avatar_status: "removed",
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/profile");
  return { success: true as const };
}

export async function updateShowProfilePhotoPublic(show: boolean) {
  const supabase = await createClient();
  if (!supabase) return { error: "Η υπηρεσία δεν είναι διαθέσιμη." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς." };

  const { error } = await supabase
    .from("profiles")
    .update({ show_profile_photo_public: show })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/profile");
  return { success: true as const };
}

export async function adminHideUserAvatar(userId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("profiles")
    .update({
      avatar_status: "hidden_by_admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "avatar_hidden_by_admin", "profile", userId);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true as const };
}

export async function adminRemoveUserAvatar(userId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const db = createServiceClient() ?? auth.supabase;
  const { data: profile } = await db
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.avatar_path) {
    await db.storage.from(PROFILE_AVATARS_BUCKET).remove([profile.avatar_path]);
  }

  const { error } = await db
    .from("profiles")
    .update({
      avatar_path: null,
      avatar_status: "removed",
      avatar_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  await logAdminAudit(auth.user.id, "avatar_removed_by_admin", "profile", userId);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true as const };
}
