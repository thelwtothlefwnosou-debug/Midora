import { profileInitials } from "@/components/account/account-nav";

export const PROFILE_AVATARS_BUCKET = "profile-avatars";
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export type AvatarStatus = "active" | "hidden_by_admin" | "removed";

export type ProfileAvatarFields = {
  avatar_path?: string | null;
  avatar_status?: AvatarStatus | null;
  show_profile_photo_public?: boolean | null;
  full_name?: string | null;
  email?: string | null;
};

export function buildAvatarStoragePath(userId: string, ext: string): string {
  const safeExt = ext.replace(/^\./, "").toLowerCase();
  return `${userId}/${crypto.randomUUID()}.${safeExt}`;
}

export function avatarPublicUrl(
  supabaseUrl: string,
  avatarPath: string | null | undefined
): string | null {
  if (!avatarPath?.trim()) return null;
  return `${supabaseUrl}/storage/v1/object/public/${PROFILE_AVATARS_BUCKET}/${avatarPath}`;
}

export function resolveProfileAvatarUrl(
  profile: ProfileAvatarFields | null | undefined,
  supabaseUrl?: string
): string | null {
  if (!profile?.avatar_path?.trim()) return null;
  if (profile.avatar_status === "removed" || profile.avatar_status === "hidden_by_admin") {
    return null;
  }
  if (!supabaseUrl) return null;
  return avatarPublicUrl(supabaseUrl, profile.avatar_path);
}

export function canShowPublicAvatar(
  profile: ProfileAvatarFields | null | undefined
): boolean {
  if (!profile?.avatar_path?.trim()) return false;
  if (profile.show_profile_photo_public === false) return false;
  if (profile.avatar_status === "removed" || profile.avatar_status === "hidden_by_admin") {
    return false;
  }
  return true;
}

export function avatarInitials(profile: ProfileAvatarFields): string {
  return profileInitials(profile.full_name ?? "", profile.email ?? "");
}

/** Message keys under `Owner.profileIdentityCard.*` */
export const AVATAR_FILE_ERROR_KEYS = {
  invalidMime: "avatarInvalidMime",
  tooLarge: "avatarTooLarge",
} as const;

export type AvatarFileErrorKey =
  (typeof AVATAR_FILE_ERROR_KEYS)[keyof typeof AVATAR_FILE_ERROR_KEYS];

export function isAvatarFileErrorKey(value: string): value is AvatarFileErrorKey {
  return (
    value === AVATAR_FILE_ERROR_KEYS.invalidMime ||
    value === AVATAR_FILE_ERROR_KEYS.tooLarge
  );
}

export function validateAvatarFile(file: File): AvatarFileErrorKey | null {
  if (!ALLOWED_AVATAR_MIME.includes(file.type as (typeof ALLOWED_AVATAR_MIME)[number])) {
    return AVATAR_FILE_ERROR_KEYS.invalidMime;
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return AVATAR_FILE_ERROR_KEYS.tooLarge;
  }
  return null;
}
