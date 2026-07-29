"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { BadgeCheck, Mail, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import {
  removeProfileAvatar,
  updateShowProfilePhotoPublic,
  uploadProfileAvatar,
} from "@/lib/profile-avatar-actions";
import {
  ALLOWED_AVATAR_MIME,
  MAX_AVATAR_SIZE_BYTES,
  validateAvatarFile,
  type ProfileAvatarFields,
} from "@/lib/profile-avatar";
import {
  advertiserTypeLabel,
  profileDisplayName,
} from "@/lib/profile-display";
import type { Profile } from "@/lib/types";
import { memberSinceLabel } from "@/components/account/account-nav";

type Props = {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  showPublicPhoto?: boolean;
  onShowPublicPhotoChange?: (value: boolean) => void;
};

export function ProfileIdentityCard({
  profile,
  email,
  avatarUrl,
  emailVerified = false,
  showPublicPhoto: showPublicPhotoProp,
  onShowPublicPhotoChange,
}: Props) {
  const t = useTranslations("Owner.profileIdentityCard");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [publicPhoto, setPublicPhoto] = useState(
    showPublicPhotoProp ?? profile.show_profile_photo_public !== false
  );
  const showPublicPhoto =
    showPublicPhotoProp !== undefined ? showPublicPhotoProp : publicPhoto;
  const [pending, startTransition] = useTransition();

  const displayUrl = previewUrl ?? avatarUrl ?? null;
  const displayName = profileDisplayName(profile, locale);
  const phoneVerified = Boolean(profile.primary_phone_verified_at);
  const memberSince = memberSinceLabel(profile.created_at, locale);
  const needsVerification = !emailVerified || !phoneVerified;

  useEffect(() => {
    if (avatarUrl && status === "success") {
      setPreviewUrl(null);
    }
  }, [avatarUrl, status]);

  function handleFilePick(file: File) {
    setError(null);
    setStatus("idle");
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(t(validationError));
      setStatus("error");
      return;
    }
    setCropFile(file);
  }

  function uploadCropped(blob: Blob, originalType: string) {
    setCropFile(null);
    setStatus("loading");
    startTransition(async () => {
      try {
        if (blob.size > MAX_AVATAR_SIZE_BYTES) {
          setError(t("errorTooLarge"));
          setStatus("error");
          return;
        }

        const ext =
          originalType === "image/png" ? "png" : originalType === "image/webp" ? "webp" : "jpg";
        const croppedFile = new File([blob], `avatar.${ext}`, {
          type: blob.type || originalType,
        });
        const preview = URL.createObjectURL(blob);
        setPreviewUrl(preview);

        const formData = new FormData();
        formData.set("avatar", croppedFile);
        const result = await uploadProfileAvatar(formData);
        if ("error" in result && result.error) {
          setError(result.error);
          setStatus("error");
          return;
        }
        setStatus("success");
        router.refresh();
      } catch {
        setError(t("errorProcessing"));
        setStatus("error");
      }
    });
  }

  function handleRemove() {
    setError(null);
    setStatus("loading");
    startTransition(async () => {
      const result = await removeProfileAvatar();
      if ("error" in result && result.error) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setPreviewUrl(null);
      setStatus("success");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-white to-[#fcfbf9] p-6 shadow-soft lg:sticky lg:top-24">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <ProfileAvatar
            profile={{ ...profile, email }}
            imageUrl={displayUrl}
            size="lg"
            className="h-32 w-32 text-2xl"
          />
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-charcoal/40">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {status === "loading" && (
          <div className="mt-3 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-sand">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gold" />
          </div>
        )}

        <h2 className="mt-5 font-display text-xl font-semibold text-charcoal">{displayName}</h2>
        <p className="mt-1 text-sm text-muted">{advertiserTypeLabel(profile.advertiser_type, locale)}</p>
        {memberSince && (
          <p className="mt-1 text-xs text-muted">{t("memberSince", { date: memberSince })}</p>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {emailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
              <Mail className="h-3 w-3" />
              {t("verifiedEmail")}
            </span>
          )}
          {phoneVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
              <BadgeCheck className="h-3 w-3" />
              {t("verifiedPhone")}
            </span>
          )}
        </div>

        {needsVerification && (
          <Link
            href="/dashboard/verification"
            className="mt-3 text-xs font-medium text-gold hover:underline"
          >
            {t("completeVerification")}
          </Link>
        )}

        <div className="mt-6 flex w-full flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            {displayUrl ? t("changePhoto") : t("uploadPhoto")}
          </button>
          {displayUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={handleRemove}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("removePhoto")}
            </button>
          )}
        </div>

        {status === "loading" && (
          <p className="mt-3 text-xs text-muted">{t("saving")}</p>
        )}
        {status === "success" && !error && (
          <p className="mt-3 text-xs text-teal">{t("photoUpdated")}</p>
        )}
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        {displayUrl && (
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-left text-xs text-muted">
            <input
              type="checkbox"
              checked={publicPhoto}
              disabled={pending}
              onChange={(e) => {
                const checked = e.target.checked;
                if (onShowPublicPhotoChange) {
                  onShowPublicPhotoChange(checked);
                } else {
                  setPublicPhoto(checked);
                }
                startTransition(async () => {
                  const result = await updateShowProfilePhotoPublic(checked);
                  if ("error" in result && result.error) {
                    const revert = !checked;
                    if (onShowPublicPhotoChange) {
                      onShowPublicPhotoChange(revert);
                    } else {
                      setPublicPhoto(revert);
                    }
                    setError(result.error);
                  }
                });
              }}
              className="accent-gold"
            />
            {t("showPublicly")}
          </label>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_AVATAR_MIME.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFilePick(file);
          e.target.value = "";
        }}
      />

      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          open
          onClose={() => setCropFile(null)}
          onConfirm={(blob) => uploadCropped(blob, cropFile.type)}
        />
      )}
    </div>
  );
}
