"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteListingPhoto } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function DeletePhotoButton({
  listingId,
  imageId,
}: {
  listingId: string;
  imageId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("Workspace.deletePhoto");

  function handleDelete() {
    if (!confirm(t("confirm"))) return;
    startTransition(async () => {
      const result = await deleteListingPhoto(listingId, imageId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 disabled:opacity-50"
      aria-label={t("aria")}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
