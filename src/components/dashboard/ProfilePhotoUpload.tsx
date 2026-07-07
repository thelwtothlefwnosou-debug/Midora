"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
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
import { cn } from "@/lib/utils";

type Props = {
  profile: ProfileAvatarFields;
  avatarUrl?: string | null;
  showPublicPhoto?: boolean;
};

function cropImageToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      const outputSize = 512;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Crop failed"));
            return;
          }
          resolve(blob);
        },
        file.type === "image/png" ? "image/png" : "image/jpeg",
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    img.src = objectUrl;
  });
}

export function ProfilePhotoUpload({ profile, avatarUrl, showPublicPhoto = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publicPhoto, setPublicPhoto] = useState(showPublicPhoto);
  const [pending, startTransition] = useTransition();

  const displayUrl = previewUrl ?? avatarUrl ?? null;

  function handleFileSelect(file: File) {
    setError(null);
    setSuccess(null);

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        const cropped = await cropImageToSquare(file);
        if (cropped.size > MAX_AVATAR_SIZE_BYTES) {
          setError("Το αποτέλεσμα μετά το crop υπερβαίνει τα 5 MB. Δοκίμασε μικρότερη εικόνα.");
          return;
        }

        const preview = URL.createObjectURL(cropped);
        setPreviewUrl(preview);

        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const croppedFile = new File([cropped], `avatar.${ext}`, {
          type: cropped.type,
        });

        const formData = new FormData();
        formData.set("avatar", croppedFile);
        const result = await uploadProfileAvatar(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess("Η φωτογραφία προφίλ ενημερώθηκε.");
      } catch {
        setError("Δεν ήταν δυνατή η επεξεργασία της εικόνας.");
      }
    });
  }

  function handleRemove() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await removeProfileAvatar();
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreviewUrl(null);
      setSuccess("Η φωτογραφία προφίλ αφαιρέθηκε.");
    });
  }

  function handlePublicToggle(checked: boolean) {
    setPublicPhoto(checked);
    startTransition(async () => {
      const result = await updateShowProfilePhotoPublic(checked);
      if (result.error) {
        setError(result.error);
        setPublicPhoto(!checked);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          <ProfileAvatar profile={profile} imageUrl={displayUrl} size="lg" className="h-24 w-24 text-xl" />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-charcoal shadow-sm hover:bg-sand disabled:opacity-50"
            aria-label="Ανέβασμα φωτογραφίας"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-muted">
            Ανέβασε μια τετράγωνη φωτογραφία (JPG, PNG ή WEBP, έως 5 MB). Θα κεντραριστεί
            αυτόματα.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-50"
            >
              {displayUrl ? "Αλλαγή φωτογραφίας" : "Επιλογή φωτογραφίας"}
            </button>
            {displayUrl && (
              <button
                type="button"
                disabled={pending}
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Αφαίρεση
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_AVATAR_MIME.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />

      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-sand/30 px-4 py-3 text-sm",
          pending && "opacity-60"
        )}
      >
        <input
          type="checkbox"
          checked={publicPhoto}
          disabled={pending || !displayUrl}
          onChange={(e) => handlePublicToggle(e.target.checked)}
          className="accent-gold"
        />
        <span className="text-charcoal">Εμφάνιση φωτογραφίας δημόσια στις αγγελίες μου</span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-teal">{success}</p>}
    </div>
  );
}
